"""
MHT CET Question Management API
Main application file with CRUD operations and image upload support.
"""

from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import engine, SessionLocal
from models import Base, Question

# ==========================================
# CONSTANTS
# ==========================================

UPLOAD_DIR = Path("uploads/questions")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_FORMATS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

# ==========================================
# APP INITIALIZATION
# ==========================================

app = FastAPI(
    title="MHT CET API",
    description="Question Management System with Image Support",
    version="1.0.0"
)

# ==========================================
# MIDDLEWARE
# ==========================================

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Setup
Base.metadata.create_all(bind=engine)

# Static Files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ==========================================
# PYDANTIC MODELS
# ==========================================

class QuestionCreate(BaseModel):
    """Model for creating a new question"""
    subject: str
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct: str


class QuestionResponse(BaseModel):
    """Model for question response"""
    id: int
    subject: str
    question: str
    options: list[str]
    correct: str
    has_image: bool
    image_url: Optional[str] = None


class UploadResponse(BaseModel):
    """Model for upload response"""
    message: str
    question_id: int
    image_url: Optional[str] = None


# ==========================================
# DATABASE DEPENDENCY
# ==========================================

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def validate_file(file: UploadFile) -> dict:
    """
    Validate uploaded file format and size.
    
    Args:
        file: Uploaded file
        
    Returns:
        dict with file content and metadata
        
    Raises:
        HTTPException: If validation fails
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Allowed: {', '.join(ALLOWED_FORMATS)}"
        )

    return {"filename": file.filename, "extension": file_ext}


async def validate_file_size(file: UploadFile) -> bytes:
    """
    Read and validate file size.
    
    Args:
        file: Uploaded file
        
    Returns:
        File content in bytes
        
    Raises:
        HTTPException: If file is too large
    """
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large (max {MAX_FILE_SIZE / (1024*1024):.0f}MB)"
        )
    return content


def validate_form_data(
    subject: str,
    option_a: str,
    option_b: str,
    option_c: str,
    option_d: str,
    correct: str
) -> None:
    """
    Validate form fields.
    
    Raises:
        HTTPException: If validation fails
    """
    if not subject or not subject.strip():
        raise HTTPException(status_code=400, detail="Subject is required")

    options = [option_a, option_b, option_c, option_d]
    if not all(options):
        raise HTTPException(
            status_code=400,
            detail="All four options (A, B, C, D) are required"
        )

    if not correct or not correct.strip():
        raise HTTPException(status_code=400, detail="Correct answer is required")


def format_question_response(question: Question) -> dict:
    """
    Format database question object to response format.
    
    Args:
        question: Question database object
        
    Returns:
        Formatted question dictionary
    """
    data = {
        "id": question.id,
        "subject": question.subject,
        "question": question.question,
        "options": [
            question.option_a,
            question.option_b,
            question.option_c,
            question.option_d
        ],
        "correct": question.correct,
        "has_image": question.has_image
    }

    if question.has_image and question.image_filename:
        data["image_url"] = f"/uploads/questions/{question.image_filename}"

    return data


def save_upload_file(filename: str, content: bytes) -> tuple[str, str]:
    """
    Save uploaded file to disk with timestamp.
    
    Args:
        filename: Original filename
        content: File content in bytes
        
    Returns:
        Tuple of (unique_filename, file_path_str)
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp}_{filename}"
    file_path = UPLOAD_DIR / unique_filename

    with open(file_path, "wb") as f:
        f.write(content)

    return unique_filename, str(file_path)


# ==========================================
# ENDPOINTS - HEALTH CHECK
# ==========================================

@app.get("/")
def root() -> dict:
    """Root endpoint - API status"""
    return {
        "status": "online",
        "message": "MHT CET API Running"
    }


@app.get("/health")
def health() -> dict:
    """Health check endpoint"""
    return {"status": "healthy"}


# ==========================================
# ENDPOINTS - QUESTIONS (CRUD)
# ==========================================

@app.post("/questions", response_model=dict)
def create_question(q: QuestionCreate, db: Session = Depends(get_db)) -> dict:
    """Create a new text-based question"""
    new_question = Question(
        subject=q.subject,
        question=q.question,
        option_a=q.option_a,
        option_b=q.option_b,
        option_c=q.option_c,
        option_d=q.option_d,
        correct=q.correct,
        has_image=False
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return {
        "message": "Question Added ✅",
        "question_id": new_question.id
    }


@app.get("/questions", response_model=list[dict])
def get_all_questions(db: Session = Depends(get_db)) -> list[dict]:
    """Retrieve all questions"""
    questions = db.query(Question).all()
    return [format_question_response(q) for q in questions]


@app.get("/questions/{question_id}", response_model=dict)
def get_single_question(question_id: int, db: Session = Depends(get_db)) -> dict:
    """Retrieve a specific question by ID"""
    question = db.query(Question).filter(Question.id == question_id).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return format_question_response(question)


@app.put("/questions/{question_id}", response_model=dict)
def update_question(
    question_id: int,
    updated: QuestionCreate,
    db: Session = Depends(get_db)
) -> dict:
    """Update an existing question"""
    question = db.query(Question).filter(Question.id == question_id).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.subject = updated.subject
    question.question = updated.question
    question.option_a = updated.option_a
    question.option_b = updated.option_b
    question.option_c = updated.option_c
    question.option_d = updated.option_d
    question.correct = updated.correct
    question.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(question)

    return {"message": "Question updated ✅"}


@app.delete("/questions/{question_id}", response_model=dict)
def delete_question(question_id: int, db: Session = Depends(get_db)) -> dict:
    """Delete a question and its associated image"""
    question = db.query(Question).filter(Question.id == question_id).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Delete image file if exists
    if question.has_image and question.image_path:
        image_path = Path(question.image_path)
        if image_path.exists():
            image_path.unlink()  # Remove file

    db.delete(question)
    db.commit()

    return {"message": "Question deleted ✅"}


# ==========================================
# ENDPOINTS - IMAGE UPLOAD
# ==========================================

@app.post("/questions/upload-image", response_model=UploadResponse)
async def upload_question_with_image(
    file: UploadFile = File(...),
    subject: str = Form(...),
    question: str = Form(default=""),
    option_a: str = Form(...),
    option_b: str = Form(...),
    option_c: str = Form(...),
    option_d: str = Form(...),
    correct: str = Form(...),
    db: Session = Depends(get_db)
) -> UploadResponse:
    """
    Upload a question with an associated image.
    
    Args:
        file: Image file (JPG, PNG, WEBP)
        subject: Question subject
        question: Question description (optional)
        option_a, option_b, option_c, option_d: Answer options
        correct: Correct answer
        db: Database session
        
    Returns:
        Upload response with question ID and image URL
    """
    # Validate file
    validate_file(file)
    file_content = await validate_file_size(file)

    # Validate form data
    validate_form_data(subject, option_a, option_b, option_c, option_d, correct)

    # Save file
    unique_filename, file_path = save_upload_file(file.filename, file_content)

    # Create question record
    new_question = Question(
        subject=subject,
        question=question or "",
        option_a=option_a,
        option_b=option_b,
        option_c=option_c,
        option_d=option_d,
        correct=correct,
        image_path=file_path,
        image_filename=unique_filename,
        has_image=True
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return UploadResponse(
        message="Image question uploaded ✅",
        question_id=new_question.id,
        image_url=f"/uploads/questions/{unique_filename}"
    )