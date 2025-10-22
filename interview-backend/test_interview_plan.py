#!/usr/bin/env python3
"""Test interview plan generation"""

import os
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
import json

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

from google.generativeai.types import HarmCategory, HarmBlockThreshold

SAFETY_SETTINGS = [
    {"category": HarmCategory.HARM_CATEGORY_HARASSMENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
    {"category": HarmCategory.HARM_CATEGORY_HATE_SPEECH, "threshold": HarmBlockThreshold.BLOCK_NONE},
    {"category": HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, "threshold": HarmBlockThreshold.BLOCK_NONE},
    {"category": HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, "threshold": HarmBlockThreshold.BLOCK_NONE},
]

model = genai.GenerativeModel("gemini-2.5-flash", safety_settings=SAFETY_SETTINGS)

async def test_plan():
    company = "Google"
    role = "Software Engineer"
    yoe = 3
    
    prompt = f"""Create an interview plan for {role} at {company} with {yoe} years experience.

Guidelines:
- Senior (6+ YOE): 6-8 rounds
- Mid-level (3-5 YOE): 5-6 rounds  
- Junior (0-2 YOE): 3-5 rounds

Return ONLY a JSON array in this format:
[
  {{"title": "Round Name", "type": "behavioral", "question_count": 2, "estimated_minutes": 30}},
  {{"title": "Coding Round", "type": "dsa", "question_count": 2, "estimated_minutes": 45}}
]

Types: behavioral, technical, dsa, mcq
Vary rounds based on company culture."""
    
    try:
        print(f"🧪 Testing interview plan generation for {role} at {company} ({yoe} YOE)...")
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2000
            )
        )
        
        print(f"✅ Response received!")
        print(f"Finish reason: {response.candidates[0].finish_reason}")
        print(f"\nRaw response:\n{response.text}\n")
        
        # Extract JSON
        raw = response.text.strip()
        start = raw.find('[')
        end = raw.rfind(']') + 1
        if start >= 0 and end > start:
            json_str = raw[start:end]
            plan = json.loads(json_str)
            print(f"✅ Parsed {len(plan)} rounds:")
            for i, r in enumerate(plan, 1):
                print(f"  {i}. {r.get('title')} ({r.get('type')}) - {r.get('question_count')} questions, ~{r.get('estimated_minutes')} min")
        else:
            print("❌ No JSON array found in response")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_plan())
