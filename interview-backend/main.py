# main.py

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import json

app = FastAPI()

# Enable CORS for the frontend
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock in-memory storage for session data
session_data: Dict[str, Any] = {}

# Mock AI service to generate questions and rounds
class MockAIService:
    @staticmethod
    def generate_question(job_role: str, years_of_experience: int, company_name: str, round_title: str):
        # This function would call a real AI model API
        if "Behavioral" in round_title or "Screen" in round_title:
            return f"Tell me about a time you demonstrated strong leadership at {company_name}."
        elif "Technical" in round_title or "DSA" in round_title or "Coding" in round_title:
            return f"Given the responsibilities of a {job_role} at {company_name}, solve a common technical problem."
        elif "System Design" in round_title:
            return f"Design a system to handle {company_name}'s daily user traffic spikes."
        return f"How do you think your experience will help you at {company_name}?"

    @staticmethod
    def generate_interview_plan(company_name: str, job_role: str) -> List[Dict[str, Any]]:
        # This is where the AI is prompted to act as the interview architect.
        # The prompt would ask the AI to return a JSON string.
        # Example prompt:
        # "Act as an interview expert. Provide the typical interview format for a {job_role} at {company_name} in JSON format.
        # Each round should have a 'title', 'type', and 'question_count'. Return only the JSON."

        # For this mock, we'll return a JSON structure directly.
        company_key = company_name.lower().strip()
        if "google" in company_key and "software engineer" in job_role.lower():
            return [
                {"title": "Recruiter Screen", "type": "behavioral", "question_count": 1},
                {"title": "Technical Interview 1", "type": "dsa", "question_count": 2},
                {"title": "System Design Round", "type": "system-design", "question_count": 1},
                {"title": "Final Behavioral", "type": "behavioral", "question_count": 2},
            ]
        elif "amazon" in company_key and "sde" in job_role.lower():
            return [
                {"title": "Leadership Principles", "type": "behavioral", "question_count": 3},
                {"title": "Coding Interview", "type": "dsa", "question_count": 2},
                {"title": "System Design Interview", "type": "system-design", "question_count": 1},
            ]
        else:
            return [
                {"title": "Initial Screen", "type": "behavioral", "question_count": 1},
                {"title": "Technical Round", "type": "dsa", "question_count": 2},
            ]

@app.post("/api/submit-answer")
async def submit_answer(answer_data: Body):
    session_id = answer_data.get("sessionId")
    session = session_data.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    interview_plan = session["interview_plan"]
    current_round_index = session["current_round_index"]
    current_question_index = session["current_question_index"]
    
    current_round = interview_plan[current_round_index]
    
    # Check if there are more questions in the current round
    if current_question_index + 1 < current_round["question_count"]:
        session["current_question_index"] += 1
        
        next_question = MockAIService.generate_question(
            job_role=session["job_role"],
            years_of_experience=session["years_of_experience"],
            company_name=session["company_name"],
            round_title=current_round["title"]
        )
        
        return {
            "question": next_question,
            "roundTitle": current_round["title"],
            "isComplete": False,
        }
    else:
        # Move to the next round or complete the interview
        if current_round_index + 1 < len(interview_plan):
            session["current_round_index"] += 1
            session["current_question_index"] = 0
            
            next_round = interview_plan[session["current_round_index"]]
            next_question = MockAIService.generate_question(
                job_role=session["job_role"],
                years_of_experience=session["years_of_experience"],
                company_name=session["company_name"],
                round_title=next_round["title"]
            )
            
            return {
                "question": next_question,
                "roundTitle": next_round["title"],
                "isComplete": False,
            }
        else:
            return {
                "question": "Congratulations! You have completed the mock interview.",
                "roundTitle": "Interview Complete",
                "isComplete": True,
            }

@app.post("/api/start-interview")
async def start_interview(
    resumeFile: UploadFile = File(...),
    jobDescription: str = Form(...),
    yearsOfExperience: int = Form(...),
    jobRole: str = Form(...),
    companyName: str = Form(...)
):
    if not all([resumeFile, jobDescription, yearsOfExperience, jobRole, companyName]):
        raise HTTPException(status_code=400, detail="Missing required form data.")
    
    # Use AI to generate the full interview plan
    interview_plan = MockAIService.generate_interview_plan(companyName, jobRole)
    
    session_id = "mock_" + str(hash(companyName.lower() + jobRole))[2:]
    
    # Use the first round from the AI-generated plan to get the first question
    initial_round = interview_plan[0]
    initial_question = MockAIService.generate_question(
        job_role=jobRole,
        years_of_experience=yearsOfExperience,
        company_name=companyName,
        round_title=initial_round["title"]
    )

    session_data[session_id] = {
        "job_description": jobDescription,
        "years_of_experience": yearsOfExperience,
        "job_role": jobRole,
        "company_name": companyName,
        "interview_plan": interview_plan,
        "current_round_index": 0,
        "current_question_index": 0,
    }
    
    return {
        "message": "Interview session started successfully.",
        "sessionId": session_id,
        "question": initial_question,
        "roundTitle": initial_round["title"],
        "isComplete": False,
    }