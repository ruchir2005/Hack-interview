"""
cv_behavior_monitor.py
Real-time behavior monitoring using OpenCV + MediaPipe Holistic / FaceMesh.

Outputs:
 - Overlayed camera window with status
 - Console logs for events ("looked away", "slouching", "left camera")
 - Periodic summary metrics stored in `behavior_log.csv` (append)

Notes:
 - This is heuristic. Tweak thresholds to fit your camera/view/environment.
 - Run locally and integrate outputs with your interview app via WebSocket / REST.
"""

import cv2
import time
import numpy as np
import mediapipe as mp
from collections import deque
import csv
import os

# ------------------------------
# Configuration / thresholds
# ------------------------------
FRAME_SKIP = 1            # process every frame (set >1 to reduce CPU)
AWAY_SECONDS_THRESHOLD = 2.0   # seconds before marking as 'looking away'
MISSING_SECONDS_THRESHOLD = 3.0  # seconds before marking as 'not present'
SLOUCH_ANGLE_THRESHOLD = 20.0  # degrees tilt forward considered slouching
NERVous_EYE_BLINK_RATE = 0.35  # blinks per second considered nervous (example)
SUMMARY_INTERVAL = 10      # seconds to write summary log

# ------------------------------
# MediaPipe set up
# ------------------------------
mp_face_mesh = mp.solutions.face_mesh
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

# We'll use Holistic (it returns pose + face + hands)
holistic = mp_holistic.Holistic(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    enable_segmentation=False,
    refine_face_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

# ------------------------------
# Utility / helper functions
# ------------------------------
def get_landmark_coords(landmarks, idx, frame_w, frame_h):
    lm = landmarks[idx]
    return np.array([int(lm.x * frame_w), int(lm.y * frame_h), lm.z])

def angle_between(v1, v2):
    """Angle in degrees between vectors v1 and v2"""
    cosang = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
    cosang = np.clip(cosang, -1.0, 1.0)
    return np.degrees(np.arccos(cosang))

def head_direction_estimate(face_landmarks, image_w, image_h):
    """
    Heuristic head pose estimate using face landmarks.
    Uses nose tip relative to eye centers and face center.
    Returns: dict with 'yaw' (left/right), 'pitch' (up/down), 'roll' (tilt)
    Positive yaw means looking right (subject's right); positive pitch means looking down
    """
    # Landmark indices (MediaPipe face mesh):
    # note: these indices are typical — they work with MP FaceMesh's refined landmarks
    # nose_tip=1, left_eye_outer=33, right_eye_outer=263, mouth_left=61, mouth_right=291, chin=199
    try:
        pts = face_landmarks.landmark
        nose = np.array([pts[1].x * image_w, pts[1].y * image_h])
        left_eye = np.array([pts[33].x * image_w, pts[33].y * image_h])
        right_eye = np.array([pts[263].x * image_w, pts[263].y * image_h])
        chin = np.array([pts[199].x * image_w, pts[199].y * image_h])
    except Exception:
        return None

    eye_center = (left_eye + right_eye) / 2.0
    face_center = (eye_center + chin) / 2.0

    # vector from face center to nose (approx head direction)
    v = nose - face_center

    # yaw approx: x offset normalized by face width (positive means nose to right)
    face_width = np.linalg.norm(right_eye - left_eye) + 1e-8
    yaw = (v[0] / face_width) * 50.0

    # pitch approx: y offset normalized by face height (positive means nose lower => looking down)
    face_height = np.linalg.norm(chin - eye_center) + 1e-8
    pitch = (v[1] / face_height) * 50.0

    # roll via eyes line slope
    eyes_vec = right_eye - left_eye
    roll = np.degrees(np.arctan2(eyes_vec[1], eyes_vec[0]))

    return {"yaw": float(yaw), "pitch": float(pitch), "roll": float(roll)}

def posture_slouch_estimate(pose_landmarks, image_w, image_h):
    """
    Use pose landmarks to estimate forward head / slouch:
    Compare the angle between shoulders-hip vector and vertical.
    Return forward_tilt_deg (positive means leaning forward).
    """
    try:
        left_shoulder = np.array([
            pose_landmarks.landmark[mp_holistic.PoseLandmark.LEFT_SHOULDER].x * image_w,
            pose_landmarks.landmark[mp_holistic.PoseLandmark.LEFT_SHOULDER].y * image_h
        ])
        right_shoulder = np.array([
            pose_landmarks.landmark[mp_holistic.PoseLandmark.RIGHT_SHOULDER].x * image_w,
            pose_landmarks.landmark[mp_holistic.PoseLandmark.RIGHT_SHOULDER].y * image_h
        ])
        left_hip = np.array([
            pose_landmarks.landmark[mp_holistic.PoseLandmark.LEFT_HIP].x * image_w,
            pose_landmarks.landmark[mp_holistic.PoseLandmark.LEFT_HIP].y * image_h
        ])
        right_hip = np.array([
            pose_landmarks.landmark[mp_holistic.PoseLandmark.RIGHT_HIP].x * image_w,
            pose_landmarks.landmark[mp_holistic.PoseLandmark.RIGHT_HIP].y * image_h
        ])
    except Exception:
        return None

    shoulder_mid = (left_shoulder + right_shoulder) / 2.0
    hip_mid = (left_hip + right_hip) / 2.0

    torso_vec = hip_mid - shoulder_mid  # vector pointing downwards/backwards if slouching
    # compute angle between torso vector and vertical (0,-1)
    vertical = np.array([0.0, 1.0])
    torso_dir = np.array([torso_vec[0], torso_vec[1]])
    tilt_deg = angle_between(torso_dir, vertical)
    # positive tilt => leaning forward/back depending on coordinate system, we just use magnitude
    return float(tilt_deg)

# ------------------------------
# Main loop
# ------------------------------
def main():
    cap = cv2.VideoCapture(0)
    time.sleep(1.0)

    last_face_time = time.time()
    last_eye_contact_time = time.time()
    last_presence = True

    behavior_log = []  # keep recent stats
    blink_timestamps = deque(maxlen=50)

    # For smoothing status
    yaw_hist = deque(maxlen=10)
    pitch_hist = deque(maxlen=10)
    slouch_hist = deque(maxlen=10)
    presence_hist = deque(maxlen=10)

    last_summary_time = time.time()

    # Create CSV for logs
    csv_file = "behavior_log.csv"
    if not os.path.exists(csv_file):
        with open(csv_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["timestamp", "presence", "eye_contact", "emotion_hint", "slouch_deg", "yaw", "pitch"])

    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Unable to read from camera")
            break

        frame_idx += 1
        if frame_idx % FRAME_SKIP != 0:
            continue

        image_h, image_w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = holistic.process(rgb)

        now = time.time()
        presence = False
        eye_contact = "unknown"
        emotion_hint = "neutral"
        slouch_deg = 0.0
        yaw = 0.0
        pitch = 0.0

        # Face presence
        if results.face_landmarks:
            presence = True
            last_face_time = now

            # Head direction
            hd = head_direction_estimate(results.face_landmarks, image_w, image_h)
            if hd:
                yaw_hist.append(hd["yaw"])
                pitch_hist.append(hd["pitch"])
                yaw = np.mean(yaw_hist)
                pitch = np.mean(pitch_hist)

            # Very simple eye-contact heuristic:
            # If yaw magnitude small and pitch small => likely looking at screen
            if abs(yaw) < 15 and abs(pitch) < 15:
                eye_contact = "good"
                last_eye_contact_time = now
            else:
                # if yaw or pitch exceed thresholds -> away
                eye_contact = "away"

            # Optional: Eyelid blink detection (rough) using relative distances between eyelid landmarks
            # We'll try to detect rapid blink rate -> nervousness indicator
            try:
                # using landmarks around eye: upper and lower eyelid approximations (indices)
                # Note: indices are based on MediaPipe FaceMesh
                lm = results.face_landmarks.landmark
                # left eye upper ~ 159, lower ~ 145 ; right eye upper ~ 386, lower ~ 374 (approx common indices)
                l_up = np.array([lm[159].x * image_w, lm[159].y * image_h])
                l_down = np.array([lm[145].x * image_w, lm[145].y * image_h])
                r_up = np.array([lm[386].x * image_w, lm[386].y * image_h])
                r_down = np.array([lm[374].x * image_w, lm[374].y * image_h])
                left_eye_h = np.linalg.norm(l_up - l_down)
                right_eye_h = np.linalg.norm(r_up - r_down)
                # normalized by face height
                face_h = max(1.0, np.linalg.norm(np.array([lm[10].x*image_w, lm[10].y*image_h]) - np.array([lm[152].x*image_w, lm[152].y*image_h])))
                eye_ratio = (left_eye_h + right_eye_h) / (2.0 * face_h + 1e-8)

                # threshold for blink (very heuristic)
                if eye_ratio < 0.018:
                    blink_timestamps.append(now)
                    # compute rate
                # compute blink rate in last 5 sec
                blinks_in_5s = sum(1 for t in blink_timestamps if now - t <= 5.0)
                blink_rate = blinks_in_5s / 5.0
                if blink_rate > NERVous_EYE_BLINK_RATE:
                    emotion_hint = "nervous"
                else:
                    emotion_hint = "neutral"
            except Exception:
                pass

        else:
            presence = False

        # Pose / slouch detection
        if results.pose_landmarks:
            sd = posture_slouch_estimate(results.pose_landmarks, image_w, image_h)
            if sd is not None:
                slouch_hist.append(sd)
                slouch_deg = float(np.mean(slouch_hist))
        else:
            slouch_deg = 0.0

        # Update history
        presence_hist.append(1 if presence else 0)

        # Decide status messages
        status_msgs = []

        # Presence checks
        if not presence:
            # check how long since last face
            missing_for = now - last_face_time
            if missing_for > MISSING_SECONDS_THRESHOLD:
                status_msgs.append("NOT IN CAMERA")
        else:
            # eye contact check
            if eye_contact == "away":
                away_for = now - last_eye_contact_time
                # If recently looked away, warn
                if away_for > AWAY_SECONDS_THRESHOLD:
                    status_msgs.append("Please maintain eye contact")
            else:
                status_msgs.append("Good eye contact")

            # posture
            if slouch_deg > SLOUCH_ANGLE_THRESHOLD:
                status_msgs.append("You are slouching — sit upright")
            else:
                status_msgs.append("Posture OK")

            # emotion hint
            if emotion_hint != "neutral":
                status_msgs.append(f"Appears {emotion_hint}")

        # Overlay status on frame
        overlay = frame.copy()
        cv2.rectangle(overlay, (0,0), (image_w, 80), (0,0,0), -1)
        alpha = 0.5
        cv2.addWeighted(overlay, alpha, frame, 1-alpha, 0, frame)

        # Header & metrics
        y = 20
        cv2.putText(frame, f"Presence: {'Yes' if presence else 'No'}", (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)
        cv2.putText(frame, f"Eye: {eye_contact}", (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1)
        cv2.putText(frame, f"Yaw:{yaw:.1f} Pitch:{pitch:.1f} Slouch:{slouch_deg:.1f}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255,255,255), 1)

        # draw status messages
        for i, msg in enumerate(status_msgs):
            cv2.putText(frame, msg, (10, 100 + i*25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)

        # draw face & pose landmarks for debugging
        if results.face_landmarks:
            mp_drawing.draw_landmarks(frame, results.face_landmarks, mp_face_mesh.FACEMESH_TESSELATION,
                                      landmark_drawing_spec=None,
                                      connection_drawing_spec=mp_drawing.DrawingSpec(color=(0,255,0), thickness=1, circle_radius=1))
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)

        cv2.imshow("Behavior Monitor", frame)

        # Log periodic summary
        if now - last_summary_time > SUMMARY_INTERVAL:
            last_summary_time = now
            presence_pct = 100.0 * (sum(presence_hist)/len(presence_hist)) if len(presence_hist)>0 else 0.0
            avg_yaw = np.mean(yaw_hist) if len(yaw_hist)>0 else 0.0
            avg_pitch = np.mean(pitch_hist) if len(pitch_hist)>0 else 0.0
            avg_slouch = np.mean(slouch_hist) if len(slouch_hist)>0 else 0.0
            # append to csv
            with open(csv_file, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([time.strftime("%Y-%m-%d %H:%M:%S"), f"{presence_pct:.1f}", eye_contact, emotion_hint, f"{avg_slouch:.1f}", f"{avg_yaw:.1f}", f"{avg_pitch:.1f}"])
            print(f"[SUMMARY] presence={presence_pct:.1f}% avg_yaw={avg_yaw:.1f} avg_pitch={avg_pitch:.1f} slouch={avg_slouch:.1f}")

        # key handling
        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
