#!/usr/bin/env python3
"""
Quick test to verify MediaPipe face detection is working
"""
import cv2
import mediapipe as mp

print("Testing MediaPipe face detection...")

# Initialize
mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(
    static_image_mode=False,
    model_complexity=0,
    min_detection_confidence=0.3,
    min_tracking_confidence=0.3,
)

# Try to open webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Cannot open webcam")
    exit(1)

print("Webcam opened successfully")
print("Press 'q' to quit")
print("Analyzing frames...")

frame_count = 0
detected_count = 0

while frame_count < 30:  # Test 30 frames
    ret, frame = cap.read()
    if not ret:
        print("ERROR: Cannot read frame")
        break
    
    frame_count += 1
    
    # Convert to RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(rgb)
    
    if results.face_landmarks:
        detected_count += 1
        print(f"Frame {frame_count}: ✓ Face detected!")
    else:
        print(f"Frame {frame_count}: ✗ No face detected")
    
    # Show frame
    if results.face_landmarks:
        cv2.putText(frame, "FACE DETECTED", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    else:
        cv2.putText(frame, "NO FACE", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    
    cv2.imshow('MediaPipe Test', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
holistic.close()

print(f"\nResults: {detected_count}/{frame_count} frames detected face")
print(f"Detection rate: {(detected_count/frame_count)*100:.1f}%")

if detected_count == 0:
    print("\n⚠️  WARNING: No faces detected!")
    print("Possible issues:")
    print("  - Camera not pointing at face")
    print("  - Poor lighting")
    print("  - Face too far from camera")
    print("  - MediaPipe models not properly installed")
else:
    print("\n✓ MediaPipe is working correctly!")
