#!/usr/bin/env python3
"""
Real-Time Computer Vision Demo with Dynamic Visualization
Shows all metrics, feedback, and visual indicators on screen

Press 'q' to quit
Press 's' to save screenshot
"""

import cv2
from vision_service import VisionService

def main():
    print("=" * 60)
    print("  AI Interview - Computer Vision Demo")
    print("=" * 60)
    print("\nStarting webcam...")
    print("Controls:")
    print("  - Press 'q' to quit")
    print("  - Press 's' to save screenshot")
    print("\nFeatures displayed:")
    print("  ✓ Real-time confidence score")
    print("  ✓ Eye contact tracking")
    print("  ✓ Posture analysis")
    print("  ✓ Head pose angles")
    print("  ✓ Live feedback messages")
    print("=" * 60)
    
    # Initialize vision service
    vision_service = VisionService()
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("ERROR: Cannot open webcam")
        return
    
    # Set resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    print("\n✓ Webcam opened successfully")
    print("✓ MediaPipe loaded")
    print("\nAnalyzing... (window will open)\n")
    
    frame_count = 0
    screenshot_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("ERROR: Cannot read frame")
            break
        
        frame_count += 1
        
        # Analyze and annotate frame
        annotated_frame, metrics = vision_service.analyze_frame_with_visualization(frame)
        
        # Add frame counter
        cv2.putText(annotated_frame, f"Frame: {frame_count}", 
                   (annotated_frame.shape[1] - 150, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        
        # Display
        cv2.imshow('AI Interview - Behavior Analysis', annotated_frame)
        
        # Print metrics every 30 frames
        if frame_count % 30 == 0:
            print(f"[Frame {frame_count}] Confidence: {metrics['confidence_score']}% | "
                  f"Eye Contact: {metrics['eye_contact']} | "
                  f"Posture: {'Good' if metrics['posture']['is_good'] else 'Poor'}")
        
        # Handle key presses
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            print("\nQuitting...")
            break
        elif key == ord('s'):
            screenshot_count += 1
            filename = f"screenshot_{screenshot_count}.jpg"
            cv2.imwrite(filename, annotated_frame)
            print(f"✓ Screenshot saved: {filename}")
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    vision_service.close()
    
    print("\n" + "=" * 60)
    print(f"Session Summary:")
    print(f"  Total frames processed: {frame_count}")
    print(f"  Screenshots saved: {screenshot_count}")
    print("=" * 60)
    print("\n✓ Demo completed successfully!")

if __name__ == "__main__":
    main()
