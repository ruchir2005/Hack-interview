#!/usr/bin/env python3
"""Test Gemini API connectivity and response"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("❌ GOOGLE_API_KEY not found in .env")
    exit(1)

print(f"✓ API Key found: {api_key[:10]}...")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    print("\n🧪 Testing simple prompt...")
    response = model.generate_content("Say 'Hello, I am working!'")
    
    print(f"✅ Response received!")
    print(f"Text: {response.text}")
    print(f"Finish reason: {response.candidates[0].finish_reason}")
    
    print("\n🧪 Testing ATS-style prompt...")
    ats_prompt = """Analyze this resume for ATS compatibility.

RESUME:
John Doe
Software Engineer with 3 years experience in Python, React, AWS.

JOB DESCRIPTION:
Looking for Software Engineer with Python and cloud experience.

Provide JSON:
{
  "ats_score": 85,
  "strengths": ["Good Python experience"],
  "weaknesses": ["Could add more AWS details"],
  "recommendations": ["Add specific AWS services"],
  "keyword_match_percentage": 75,
  "overall_feedback": "Strong match"
}"""
    
    response2 = model.generate_content(ats_prompt)
    print(f"✅ ATS Response received!")
    print(f"Text: {response2.text[:200]}...")
    print(f"Finish reason: {response2.candidates[0].finish_reason}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
