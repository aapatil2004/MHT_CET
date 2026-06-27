from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime
)

from datetime import datetime
from database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)

    subject = Column(String, nullable=False)

    question = Column(String, nullable=True)

    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)

    correct = Column(String, nullable=False)

    image_path = Column(String, nullable=True)
    image_filename = Column(String, nullable=True)
    has_image = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )