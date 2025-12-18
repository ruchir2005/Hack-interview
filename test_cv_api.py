#!/usr/bin/env python3
"""
Test the CV analysis API endpoint!
"""
import requests
import base64
import json

# Create a small test image (1x1 red pixel)
import io
from PIL import Image

# Create a simple test image
img = Image.new('RGB', (100, 100), color='red')
buffer = io.BytesIO()
img.save(buffer, format='JPEG')
img_bytes = buffer.getvalue()

# Convert to base64
img_base64 = base64.b64encode(img_bytes).decode('utf-8')
img_data_url = f"data:image/jpeg;base64,{img_base64}"

print("Testing CV API endpoint...")
print(f"Image size: {len(img_data_url)} bytes")

# Test the endpoint
url = "http://localhost:8000/api/analyze-behavior"
payload = {
    "image": img_data_url,
    "sessionId": "test-session"
}

try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ API is working!")
        print(f"Response: {json.dumps(data, indent=2)}")
    else:
        print(f"\n❌ API error: {response.text}")
except Exception as e:
    print(f"\n❌ Connection error: {e}")
    print("Make sure the backend is running on port 8000")
