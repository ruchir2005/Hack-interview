"""
Vision Service for Real-time Interview Behavior Monitoring
Provides WebSocket streaming of CV analysis to frontend
"""

import cv2
import numpy as np
import mediapipe as mp
from collections import deque
import time
import asyncio
from typing import Dict, Optional
import base64

class VisionService:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_holistic = mp.solutions.holistic
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Initialize MediaPipe Holistic
        self.holistic = self.mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            refine_face_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        
        # Thresholds
        self.AWAY_SECONDS_THRESHOLD = 2.0
        self.MISSING_SECONDS_THRESHOLD = 3.0
        self.SLOUCH_ANGLE_THRESHOLD = 20.0
        
        # History for smoothing
        self.yaw_hist = deque(maxlen=10)
        self.pitch_hist = deque(maxlen=10)
        self.slouch_hist = deque(maxlen=10)
        self.presence_hist = deque(maxlen=10)
        
        # Timing
        self.last_face_time = time.time()
        self.last_eye_contact_time = time.time()
        
    def head_direction_estimate(self, face_landmarks, image_w, image_h) -> Optional[Dict]:
        """Estimate head pose (yaw, pitch, roll)"""
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
        v = nose - face_center

        face_width = np.linalg.norm(right_eye - left_eye) + 1e-8
        yaw = (v[0] / face_width) * 50.0

        face_height = np.linalg.norm(chin - eye_center) + 1e-8
        pitch = (v[1] / face_height) * 50.0

        eyes_vec = right_eye - left_eye
        roll = np.degrees(np.arctan2(eyes_vec[1], eyes_vec[0]))

        return {"yaw": float(yaw), "pitch": float(pitch), "roll": float(roll)}
    
    def posture_slouch_estimate(self, pose_landmarks, image_w, image_h) -> Optional[float]:
        """Estimate forward slouch angle"""
        try:
            left_shoulder = np.array([
                pose_landmarks.landmark[self.mp_holistic.PoseLandmark.LEFT_SHOULDER].x * image_w,
                pose_landmarks.landmark[self.mp_holistic.PoseLandmark.LEFT_SHOULDER].y * image_h
            ])
            right_shoulder = np.array([
                pose_landmarks.landmark[self.mp_holistic.PoseLandmark.RIGHT_SHOULDER].x * image_w,
                pose_landmarks.landmark[self.mp_holistic.PoseLandmark.RIGHT_SHOULDER].y * image_h
            ])
            left_hip = np.array([
                pose_landmarks.landmark[self.mp_holistic.PoseLandmark.LEFT_HIP].x * image_w,
                pose_landmarks.landmark[self.mp_holistic.PoseLandmark.LEFT_HIP].y * image_h
            ])
            right_hip = np.array([
                pose_landmarks.landmark[self.mp_holistic.PoseLandmark.RIGHT_HIP].x * image_w,
                pose_landmarks.landmark[self.mp_holistic.PoseLandmark.RIGHT_HIP].y * image_h
            ])
        except Exception:
            return None

        shoulder_mid = (left_shoulder + right_shoulder) / 2.0
        hip_mid = (left_hip + right_hip) / 2.0
        torso_vec = hip_mid - shoulder_mid
        
        vertical = np.array([0.0, 1.0])
        torso_dir = np.array([torso_vec[0], torso_vec[1]])
        
        cosang = np.dot(torso_dir, vertical) / (np.linalg.norm(torso_dir) * np.linalg.norm(vertical) + 1e-8)
        cosang = np.clip(cosang, -1.0, 1.0)
        tilt_deg = np.degrees(np.arccos(cosang))
        
        return float(tilt_deg)
    
    def analyze_frame(self, frame: np.ndarray) -> Dict:
        """
        Analyze a single frame and return behavior metrics
        Returns: dict with presence, eye_contact, posture, confidence, feedback
        """
        image_h, image_w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.holistic.process(rgb)
        
        now = time.time()
        presence = False
        eye_contact = "unknown"
        confidence_score = 50  # 0-100
        slouch_deg = 0.0
        yaw = 0.0
        pitch = 0.0
        feedback_messages = []
        
        # Face presence
        if results.face_landmarks:
            presence = True
            self.last_face_time = now
            
            # Head direction
            hd = self.head_direction_estimate(results.face_landmarks, image_w, image_h)
            if hd:
                self.yaw_hist.append(hd["yaw"])
                self.pitch_hist.append(hd["pitch"])
                yaw = np.mean(self.yaw_hist)
                pitch = np.mean(self.pitch_hist)
            
            # Eye contact check
            if abs(yaw) < 15 and abs(pitch) < 15:
                eye_contact = "good"
                self.last_eye_contact_time = now
                confidence_score += 20
                feedback_messages.append("✓ Good eye contact")
            else:
                eye_contact = "away"
                away_for = now - self.last_eye_contact_time
                if away_for > self.AWAY_SECONDS_THRESHOLD:
                    confidence_score -= 15
                    feedback_messages.append("⚠ Please look at the camera")
        else:
            presence = False
            missing_for = now - self.last_face_time
            if missing_for > self.MISSING_SECONDS_THRESHOLD:
                confidence_score = 0
                feedback_messages.append("❌ You're not in the camera frame")
        
        # Posture check
        if results.pose_landmarks:
            sd = self.posture_slouch_estimate(results.pose_landmarks, image_w, image_h)
            if sd is not None:
                self.slouch_hist.append(sd)
                slouch_deg = float(np.mean(self.slouch_hist))
                
                if slouch_deg > self.SLOUCH_ANGLE_THRESHOLD:
                    confidence_score -= 10
                    feedback_messages.append("⚠ Sit upright - you're slouching")
                else:
                    confidence_score += 10
                    feedback_messages.append("✓ Good posture")
        
        # Update presence history
        self.presence_hist.append(1 if presence else 0)
        
        # Overall confidence assessment
        if confidence_score >= 70:
            overall_feedback = "😊 You appear confident and engaged"
        elif confidence_score >= 50:
            overall_feedback = "😐 Maintain focus and posture"
        else:
            overall_feedback = "😟 Please improve your presence and engagement"
        
        return {
            "presence": presence,
            "eye_contact": eye_contact,
            "confidence_score": max(0, min(100, confidence_score)),
            "posture": {
                "slouch_angle": round(slouch_deg, 1),
                "is_good": slouch_deg <= self.SLOUCH_ANGLE_THRESHOLD
            },
            "head_pose": {
                "yaw": round(yaw, 1),
                "pitch": round(pitch, 1)
            },
            "feedback": feedback_messages,
            "overall": overall_feedback,
            "timestamp": time.time()
        }
    
    def process_base64_frame(self, base64_image: str) -> Dict:
        """
        Process a base64 encoded image from frontend
        Returns: behavior analysis dict
        """
        try:
            # Decode base64 image
            img_data = base64.b64decode(base64_image.split(',')[1] if ',' in base64_image else base64_image)
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                return {"error": "Failed to decode image"}
            
            return self.analyze_frame(frame)
        except Exception as e:
            return {"error": str(e)}
    
    def cleanup(self):
        """Release resources"""
        self.holistic.close()
