import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Paper(Base):
    __tablename__ = "papers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sha256_hash = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(String(512), nullable=False)
    authors = Column(String(1024), default="")
    year = Column(Integer, nullable=True)
    filename = Column(String(256), nullable=False)
    total_pages = Column(Integer, default=0)
    file_path = Column(String(1024), nullable=False)
    processing_status = Column(String(32), default="PENDING", index=True) # PENDING, PROCESSING, INDEXED, FAILED
    error_message = Column(Text, nullable=True)
    has_ocr_applied = Column(Boolean, default=False)
    is_test_document = Column(Boolean, default=False, index=True)
    abstract = Column(Text, nullable=True)
    affiliations = Column(Text, default="[]")
    emails = Column(Text, default="[]")
    unextractable_pages = Column(Text, default="[]")
    structured_analysis = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chunks = relationship("Chunk", back_populates="paper", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="paper", cascade="all, delete-orphan")
    limitations = relationship("Limitation", back_populates="paper", cascade="all, delete-orphan")
    tasks = relationship("BackgroundTask", back_populates="paper", cascade="all, delete-orphan")


class BackgroundTask(Base):
    __tablename__ = "background_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=True)
    task_type = Column(String(64), nullable=False) # INGESTION, CLAIM_EXTRACTION, NLI_MATRIX, EVALUATION
    status = Column(String(32), default="PENDING", index=True) # PENDING, RUNNING, COMPLETED, FAILED
    progress_percent = Column(Float, default=0.0)
    current_stage = Column(String(256), default="Initialized")
    stages_json = Column(Text, default="[]")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    paper = relationship("Paper", back_populates="tasks")


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    section_name = Column(String(128), default="General")
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    chunk_index = Column(Integer, nullable=False)
    faiss_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    paper = relationship("Paper", back_populates="chunks")
    claims = relationship("Claim", back_populates="chunk", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="chunk", cascade="all, delete-orphan")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("chunks.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    verbatim_text = Column(Text, nullable=False)
    char_start_offset = Column(Integer, default=0)
    char_end_offset = Column(Integer, default=0)
    category = Column(String(64), default="FINDING") # FINDING, METHODOLOGY, OBSERVATION
    confidence_score = Column(Float, default=0.5)
    extracted_verb = Column(String(64), default="")
    normalized_claim = Column(Text, nullable=True)
    extraction_method = Column(String(128), default="spaCy Dependency & Epistemic Parsing")
    is_candidate = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    paper = relationship("Paper", back_populates="claims")
    chunk = relationship("Chunk", back_populates="claims")


class ClaimPair(Base):
    __tablename__ = "claim_pairs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_a_id = Column(String(36), ForeignKey("claims.id", ondelete="CASCADE"), nullable=False, index=True)
    claim_b_id = Column(String(36), ForeignKey("claims.id", ondelete="CASCADE"), nullable=False, index=True)
    semantic_similarity = Column(Float, default=0.0)
    nli_label = Column(String(32), default="NEUTRAL", index=True) # ENTAILMENT, CONTRADICTION, NEUTRAL
    scientific_relationship = Column(String(64), default="NEUTRAL_OR_INSUFFICIENT_EVIDENCE")
    entailment_score = Column(Float, default=0.0)
    contradiction_score = Column(Float, default=0.0)
    neutral_score = Column(Float, default=0.0)
    context_comparison_note = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    claim_a = relationship("Claim", foreign_keys=[claim_a_id])
    claim_b = relationship("Claim", foreign_keys=[claim_b_id])


class Limitation(Base):
    __tablename__ = "limitations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    limitation_text = Column(Text, nullable=False)
    section_found = Column(String(128), default="Limitations")
    tier = Column(String(32), default="EXPLICIT_AUTHOR_STATED")
    created_at = Column(DateTime, default=datetime.utcnow)

    paper = relationship("Paper", back_populates="limitations")


class QASession(Base):
    __tablename__ = "qa_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    citations = relationship("Citation", back_populates="qa_session", cascade="all, delete-orphan")


class Citation(Base):
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    qa_id = Column(String(36), ForeignKey("qa_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_id = Column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    chunk_id = Column(String(36), ForeignKey("chunks.id", ondelete="CASCADE"), nullable=True)
    quoted_snippet = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    qa_session = relationship("QASession", back_populates="citations")
    paper = relationship("Paper")
    chunk = relationship("Chunk", back_populates="citations")
