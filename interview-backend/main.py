from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Union
import json
import os
from dotenv import load_dotenv
import base64
import docx
from PyPDF2 import PdfReader

# Import the Gemini SDK
import google.generativeai as genai

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set. Please create a .env file.")

# Configure the Gemini client
genai.configure(api_key=API_KEY)

# Initialize the Gemini model.
model = genai.GenerativeModel('gemini-1.5-pro-latest')
tts_model = genai.GenerativeModel('gemini-2.5-flash-preview-tts') # Dedicated TTS model

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_data: Dict[str, Any] = {}

class InterviewAnswer(BaseModel):
    sessionId: str
    userAnswer: str

# Pydantic models for different response types
class QuestionResponse(BaseModel):
    question: str = Field(..., description="The interview question.")
    type: str = Field(..., description="Type of the question, e.g., 'behavioral'.")

class CodingQuestionResponse(BaseModel):
    question: str = Field(..., description="The coding problem description.")
    initial_code: str = Field(..., description="Initial code snippet for the problem.")
    type: str = Field(..., description="Type of the question, e.g., 'technical'.")

class MCQQuestionResponse(BaseModel):
    question: str = Field(..., description="The multiple-choice question.")
    options: List[str] = Field(..., description="An array of possible answers.")
    correct_answer: str = Field(..., description="The correct answer to the question.")
    type: str = Field(..., description="Type of the question, 'mcq'.")
    
# Pydantic models for feedback
class FeedbackResponse(BaseModel):
    score: int
    strengths: List[str]
    weaknesses: List[str]
    feedback_text: str

class InterviewStartResponse(BaseModel):
    message: str
    sessionId: str
    questionData: Union[QuestionResponse, CodingQuestionResponse, MCQQuestionResponse]
    roundTitle: str
    isComplete: bool
    feedback: FeedbackResponse | None = Field(default=None)

class InterviewSubmitResponse(BaseModel):
    questionData: Union[QuestionResponse, CodingQuestionResponse, MCQQuestionResponse]
    roundTitle: str
    isComplete: bool
    feedback: FeedbackResponse | None = Field(default=None)

# New Pydantic model for TTS request
class TTSRequest(BaseModel):
    text: str
    voice: str = "Kore"

# New Pydantic model for STT response
class STTResponse(BaseModel):
    text: str

class ResumeParserService:
    @staticmethod
    def extract_text_from_pdf(file_path):
        text = ""
        with open(file_path, "rb") as file:
            reader = PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text

    @staticmethod
    def extract_text_from_docx(file_path):
        doc = docx.Document(file_path)
        text = [paragraph.text for paragraph in doc.paragraphs]
        return "\n".join(text)

class GeminiService:
    @staticmethod
    async def generate_interview_plan(company_name: str, job_role: str) -> List[Dict[str, Any]]:
        try:
            prompt = f"""
            As an expert interviewer, please provide the typical interview format for a {job_role} at {company_name}.
            Return the response as a valid JSON array of objects. Each object should have three keys:
            "title" (string, the name of the round), "type" (string, the type of the round e.g., "behavioral", "technical", "mcq"), and "question_count" (integer, the number of questions to ask in this round).
            Do not include any other text or explanation.

            Example JSON structure for a Senior Software Engineer at Google:
            [
              {{"title": "Screening Call", "type": "behavioral", "question_count": 1}},
              {{"title": "Online Assessment (MCQ)", "type": "mcq", "question_count": 3}},
              {{"title": "Technical Interview", "type": "technical", "question_count": 2}}
            ]
            """
            
            response = await model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.4
                )
            )
            
            return json.loads(response.text)
        except Exception as e:
            print(f"Error generating interview plan: {e}")
            return [
                {"title": "Initial Screen", "type": "behavioral", "question_count": 1},
                {"title": "Technical Round", "type": "dsa", "question_count": 2},
            ]

    @staticmethod
    async def generate_question(job_role: str, years_of_experience: int, company_name: str, round_title: str) -> QuestionResponse:
        try:
            prompt = f"""
            You are an experienced interviewer. Generate a single, concise interview question for a {job_role}
            with {years_of_experience} years of experience for the company {company_name}.
            The question should be for a '{round_title}' round.
            Do not include any other text, greetings, or explanations.
            """
            
            response = await model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8
                )
            )
            
            return QuestionResponse(question=response.text.replace('```json\n', '').replace('```', ''), type="behavioral")
        except Exception as e:
            print(f"Error generating question: {e}")
            return QuestionResponse(question="Tell me about your experience.", type="behavioral")

    @staticmethod
    async def generate_coding_question(job_role: str, years_of_experience: int, company_name: str, round_title: str) -> CodingQuestionResponse:
        try:
            prompt = f"""
            Generate a single coding interview question for a {job_role} with {years_of_experience} years of experience at {company_name}.
            Provide the problem description and a Python function signature for the solution.
            Return the response as a valid JSON object with the following keys: "question" (problem description) and "initial_code" (a string with the function signature).
            Do not include any other text or explanation.

            Example JSON:
            {{
              "question": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
              "initial_code": "def two_sum(nums, target):\\n  # Your code here"
            }}
            """
            response = await model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            result = json.loads(response.text)
            return CodingQuestionResponse(question=result["question"], initial_code=result["initial_code"], type="technical")
        except Exception as e:
            print(f"Error generating coding question: {e}")
            return CodingQuestionResponse(
                question="Given an array of numbers, return the sum of all the numbers.",
                initial_code="def sum_of_array(nums):\\n  # Your code here",
                type="technical"
            )

    @staticmethod
    async def generate_mcq_questions(job_role: str) -> MCQQuestionResponse:
        try:
            prompt = f"""
            Generate a single multiple-choice question for a {job_role} role. The question should have exactly four options (A, B, C, D) and a single correct answer.
            Return the response as a valid JSON object with the following keys: "question", "options" (an array of strings), and "correct_answer" (a string corresponding to one of the options).
            Do not include any other text or explanation.

            Example JSON:
            {{
              "question": "What is a closure in Python?",
              "options": ["A: A function that returns a dictionary.", "B: A function that remembers the values from its enclosing scope even if the scope is no longer active.", "C: A type of data structure.", "D: A form of object-oriented programming."],
              "correct_answer": "B: A function that remembers the values from its enclosing scope even if the scope is no longer active."
            }}
            """
            response = await model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            result = json.loads(response.text)
            return MCQQuestionResponse(
                question=result["question"],
                options=result["options"],
                correct_answer=result["correct_answer"],
                type="mcq"
            )
        except Exception as e:
            print(f"Error generating MCQ: {e}")
            return MCQQuestionResponse(
                question="Which of the following is not a programming language?",
                options=["A: Python", "B: JavaScript", "C: HTML", "D: C++"],
                correct_answer="C: HTML",
                type="mcq"
            )
    
    @staticmethod
    async def convert_text_to_speech(text: str, voice_name: str) -> bytes:
        """
        Converts text to audio data using the Gemini TTS model.
        """
        try:
            tts_response = await tts_model.generate_content_async(
                text,
                generation_config=genai.types.GenerationConfig(
                    response_modalities=["AUDIO"],
                    speech_config={
                        "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice_name}}
                    }
                )
            )
            
            audio_data = tts_response.candidates[0].content.parts[0].inline_data.data
            return audio_data

        except Exception as e:
            print(f"TTS error: {e}")
            return b""  # Return empty bytes on error

    @staticmethod
    async def convert_speech_to_text(audio_file_data: bytes) -> str:
        """
        Transcribes an audio file to text using a mock STT service.
        In a real application, you'd integrate a real STT API here.
        """
        # For this mockup, we'll just return a dummy transcription.
        # This part of the code would be replaced with a real STT API call.
        return "This is a dummy transcription of your audio."
    
    @staticmethod
    async def get_feedback_and_score(question: str, userAnswer: str, company_name: str, job_role: str, extracted_resume_text: str | None = None) -> FeedbackResponse:
        """
        Generates feedback and a score for the user's answer, considering the resume.
        """
        try:
            # We'll use the extracted resume text in the prompt to personalize the feedback
            resume_prompt_part = f"The candidate's resume includes this information: {extracted_resume_text}" if extracted_resume_text else ""
            
            prompt = f"""
            You are a senior interviewer providing feedback on a candidate's answer.
            The interview question was: "{question}"
            The candidate's answer was: "{userAnswer}"
            The company is {company_name} and the role is {job_role}.
            {resume_prompt_part}
            
            Provide a detailed critique in JSON format. The JSON should have the following keys:
            "score": an integer from 1 to 10 (10 being perfect).
            "strengths": an array of strings listing what was good about the answer.
            "weaknesses": an array of strings listing what could be improved.
            "feedback_text": a summary paragraph of the overall feedback.
            
            Return only the JSON object. Do not include any other text.
            """
            
            response = await model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.5
                )
            )
            result = json.loads(response.text)
            return FeedbackResponse(**result)
        except Exception as e:
            print(f"Error generating feedback: {e}")
            return FeedbackResponse(
                score=5,
                strengths=["Answer was submitted."],
                weaknesses=["Could not generate detailed feedback due to an error."],
                feedback_text="Please try again. The AI could not process your answer."
            )


async def get_next_question_data(session: Dict[str, Any], next_round_info: Dict[str, Any]) -> Union[QuestionResponse, CodingQuestionResponse, MCQQuestionResponse]:
    """Helper function to get the next question based on the round type."""
    if next_round_info["type"] in ["technical", "dsa"]:
        return await GeminiService.generate_coding_question(
            job_role=session["job_role"],
            years_of_experience=session["years_of_experience"],
            company_name=session["company_name"],
            round_title=next_round_info["title"]
        )
    elif next_round_info["type"] == "mcq":
        return await GeminiService.generate_mcq_questions(session["job_role"])
    else:
        return await GeminiService.generate_question(
            job_role=session["job_role"],
            years_of_experience=session["years_of_experience"],
            company_name=session["company_name"],
            round_title=next_round_info["title"]
        )

# New endpoint for parsing the resume
@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    file_extension = file.filename.split('.')[-1].lower()
    
    # Save the uploaded file temporarily
    file_path = f"/tmp/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    extracted_text = ""
    try:
        if file_extension == 'pdf':
            extracted_text = ResumeParserService.extract_text_from_pdf(file_path)
        elif file_extension == 'docx':
            extracted_text = ResumeParserService.extract_text_from_docx(file_path)
        else:
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF or DOCX file.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing file: {e}")
    finally:
        os.remove(file_path) # Clean up temporary file

    # In a real app, you would pass this to an AI to extract skills, etc.
    # For now, we'll return the full text.
    return {"filename": file.filename, "extracted_text": extracted_text}


@app.post("/api/start-interview", response_model=InterviewStartResponse)
async def start_interview(
    resumeFile: UploadFile = File(...),
    jobDescription: str = Form(...),
    yearsOfExperience: int = Form(...),
    jobRole: str = Form(...),
    companyName: str = Form(...)
):
    if not all([resumeFile, jobDescription, yearsOfExperience, jobRole, companyName]):
        raise HTTPException(status_code=400, detail="Missing required form data.")
    
    # Parse the resume to get extracted text
    # This is a bit of a simplification; in a real app, this would be a separate flow
    # For now, we'll just read the file content
    file_extension = resumeFile.filename.split('.')[-1].lower()
    extracted_resume_text = ""
    try:
        if file_extension == 'pdf':
            extracted_resume_text = ResumeParserService.extract_text_from_pdf(resumeFile.file)
        elif file_extension == 'docx':
            extracted_resume_text = ResumeParserService.extract_text_from_docx(resumeFile.file)
    except Exception as e:
        print(f"Could not parse resume file: {e}")
        extracted_resume_text = ""
        
    interview_plan = await GeminiService.generate_interview_plan(companyName, jobRole)
    
    session_id = "mock_" + str(hash(companyName.lower() + jobRole))[2:]
    
    initial_round = interview_plan[0]
    initial_question_data = await get_next_question_data(
        {"job_role": jobRole, "years_of_experience": yearsOfExperience, "company_name": companyName},
        initial_round
    )
    
    # Store interview plan and other details in the session
    session_data[session_id] = {
        "job_description": jobDescription,
        "years_of_experience": yearsOfExperience,
        "job_role": jobRole,
        "company_name": companyName,
        "interview_plan": interview_plan,
        "current_round_index": 0,
        "current_question_index": 0,
        "interview_history": [],
        "extracted_resume_text": extracted_resume_text
    }
    
    return InterviewStartResponse(
        message="Interview session started successfully.",
        sessionId=session_id,
        questionData=initial_question_data,
        roundTitle=initial_round["title"],
        isComplete=False,
        feedback=None  # No feedback on the first question
    )


@app.post("/api/submit-answer", response_model=InterviewSubmitResponse)
async def submit_answer(answer_data: InterviewAnswer):
    session = session_data.get(answer_data.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    interview_plan = session["interview_plan"]
    current_round_index = session["current_round_index"]
    current_question_index = session["current_question_index"]
    
    current_round = interview_plan[current_round_index]
    
    # Get the actual question text from the Gemini Service for the feedback prompt
    question_to_feedback = ""
    if current_round["type"] in ["technical", "dsa"]:
        q_data = await GeminiService.generate_coding_question(
            job_role=session["job_role"],
            years_of_experience=session["years_of_experience"],
            company_name=session["company_name"],
            round_title=current_round["title"]
        )
        question_to_feedback = q_data.question
    elif current_round["type"] == "mcq":
        q_data = await GeminiService.generate_mcq_questions(session["job_role"])
        question_to_feedback = q_data.question
    else:
        q_data = await GeminiService.generate_question(
            job_role=session["job_role"],
            years_of_experience=session["years_of_experience"],
            company_name=session["company_name"],
            round_title=current_round["title"]
        )
        question_to_feedback = q_data.question

    # Generate feedback for the submitted answer
    feedback = await GeminiService.get_feedback_and_score(
        question=question_to_feedback,
        userAnswer=answer_data.userAnswer,
        company_name=session["company_name"],
        job_role=session["job_role"],
        extracted_resume_text=session.get("extracted_resume_text")
    )

    # Store the user's answer and feedback to the session history
    session["interview_history"].append({
        "question": question_to_feedback,
        "user_answer": answer_data.userAnswer,
        "feedback": feedback.dict()
    })
    
    if current_question_index + 1 < current_round["question_count"]:
        session["current_question_index"] += 1
        
        next_question_data = await get_next_question_data(session, current_round)
        
        return InterviewSubmitResponse(
            questionData=next_question_data,
            roundTitle=current_round["title"],
            isComplete=False,
            feedback=feedback
        )
    else:
        if current_round_index + 1 < len(interview_plan):
            session["current_round_index"] += 1
            session["current_question_index"] = 0
            
            next_round = interview_plan[session["current_round_index"]]
            next_question_data = await get_next_question_data(session, next_round)
            
            return InterviewSubmitResponse(
                questionData=next_question_data,
                roundTitle=next_round["title"],
                isComplete=False,
                feedback=feedback
            )
        else:
            return InterviewSubmitResponse(
                questionData=QuestionResponse(question="Congratulations! You have completed the mock interview.", type="complete"),
                roundTitle="Interview Complete",
                isComplete=True,
                feedback=feedback
            )


# New endpoint for Text-to-Speech
@app.post("/api/tts")
async def text_to_speech(tts_request: TTSRequest):
    try:
        audio_data = await GeminiService.convert_text_to_speech(tts_request.text, tts_request.voice)
        audio_base64 = base64.b64encode(audio_data).decode()
        return {"audio_data": audio_base64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {e}")

# New endpoint for Speech-to-Text
@app.post("/api/stt")
async def speech_to_text(audio_file: UploadFile = File(...)):
    try:
        audio_content = await audio_file.read()
        transcribed_text = await GeminiService.convert_speech_to_text(audio_content)
        return STTResponse(text=transcribed_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT error: {e}")
