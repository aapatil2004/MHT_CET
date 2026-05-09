from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import Base, Question
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency (auto open/close DB)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Request model
class QuestionCreate(BaseModel):
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct: str

@app.post("/questions")
def create_question(q: QuestionCreate, db: Session = Depends(get_db)):
    new_question = Question(
        question=q.question,
        option_a=q.option_a,
        option_b=q.option_b,
        option_c=q.option_c,
        option_d=q.option_d,
        correct=q.correct
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return {"message": "Question added"}

@app.get("/questions")
def get_questions(db: Session = Depends(get_db)):
    questions = db.query(Question).all()

    result = []
    for q in questions:
        result.append({
            "id": q.id,
            "question": q.question,
            "options": [
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d
            ],
            "correct": q.correct
        })

    return result

@app.delete("/questions/{question_id}")
def delete_question(question_id: int):
    db = SessionLocal()
    q = db.query(Question).filter(Question.id == question_id).first()

    if not q:
        return {"error": "Question not found"}

    db.delete(q)
    db.commit()

    return {"message": "Question deleted"}


@app.put("/questions/{question_id}")
def update_question(question_id: int, updated: QuestionCreate):
    db = SessionLocal()
    q = db.query(Question).filter(Question.id == question_id).first()

    if not q:
        return {"error": "Question not found"}

    q.question = updated.question
    q.option_a = updated.option_a
    q.option_b = updated.option_b
    q.option_c = updated.option_c
    q.option_d = updated.option_d
    q.correct = updated.correct

    db.commit()
    db.refresh(q)

    return {"message": "Question updated"}