import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Text, Numeric, Float, Integer, Boolean,
    DateTime, Date, ForeignKey
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_name = Column(String(200), nullable=False)
    source_url = Column(String(500), nullable=False)
    source_type = Column(String(50), nullable=False)  # API, CSV, EXCEL, MANUAL
    access_method = Column(String(100), default="PUBLIC_DOWNLOAD")
    update_frequency = Column(String(50), default="MONTHLY")
    last_successful_sync = Column(DateTime, nullable=True)
    source_status = Column(String(50), default="ACTIVE") # ACTIVE, MAINTENANCE, DEPRECATED

    projects = relationship("Project", back_populates="source")
    financial_records = relationship("FinancialRecord", back_populates="source")
    import_logs = relationship("ImportLog", back_populates="source")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_id = Column(String(36), ForeignKey("data_sources.id"), nullable=True)
    source_record_id = Column(String(100), nullable=False, index=True)
    project_name = Column(String(500), nullable=False, index=True)
    department = Column(String(200), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    taluk = Column(String(100), nullable=True, index=True)
    gram_panchayat = Column(String(100), nullable=True)
    village = Column(String(100), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    approved_budget = Column(Numeric(15, 2), nullable=True)
    revised_budget = Column(Numeric(15, 2), nullable=True)
    start_date = Column(Date, nullable=True)
    expected_end_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_precision = Column(String(50), default="APPROXIMATE_DISTRICT") # EXACT, APPROXIMATE_DISTRICT, NOT_AVAILABLE
    project_status = Column(String(50), default="ONGOING", index=True) # PLANNED, ONGOING, COMPLETED, DELAYED, SUSPENDED
    data_origin = Column(String(50), default="SAMPLE_DATA", index=True) # LIVE_API, OFFICIAL_REPORT_IMPORT, SAMPLE_DATA
    retrieval_timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    source = relationship("DataSource", back_populates="projects")
    financial_records = relationship("FinancialRecord", back_populates="project", cascade="all, delete-orphan")
    progress_updates = relationship("ProgressUpdate", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("ProjectDocument", back_populates="project", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="project", cascade="all, delete-orphan")


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    source_id = Column(String(36), ForeignKey("data_sources.id"), nullable=True)
    financial_year = Column(String(20), nullable=False, index=True)
    approved_amount = Column(Numeric(15, 2), nullable=True)
    released_amount = Column(Numeric(15, 2), nullable=True)
    expenditure_amount = Column(Numeric(15, 2), nullable=True)
    awarded_contract_value = Column(Numeric(15, 2), nullable=True)
    tender_value = Column(Numeric(15, 2), nullable=True)
    reporting_date = Column(Date, nullable=True)
    source_record_id = Column(String(100), nullable=True)
    source_url = Column(String(500), nullable=True)

    project = relationship("Project", back_populates="financial_records")
    source = relationship("DataSource", back_populates="financial_records")


class ProgressUpdate(Base):
    __tablename__ = "progress_updates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    progress_percentage = Column(Float, nullable=False)
    progress_description = Column(Text, nullable=True)
    reported_status = Column(String(50), nullable=True)
    reporting_date = Column(Date, nullable=True)
    source_id = Column(String(36), ForeignKey("data_sources.id"), nullable=True)
    source_record_id = Column(String(100), nullable=True)
    source_url = Column(String(500), nullable=True)

    project = relationship("Project", back_populates="progress_updates")


class ProjectDocument(Base):
    __tablename__ = "project_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    document_type = Column(String(100), default="REPORT") # SANCTION_ORDER, TENDER_DOC, AUDIT_REPORT, PROGRESS_REPORT
    document_url = Column(String(500), nullable=False)
    document_title = Column(String(255), nullable=False)
    publication_date = Column(Date, nullable=True)
    source_id = Column(String(36), ForeignKey("data_sources.id"), nullable=True)

    project = relationship("Project", back_populates="documents")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    prediction_type = Column(String(50), nullable=False) # DELAY_RISK, FINANCIAL_ANOMALY
    risk_score = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH
    explanation = Column(Text, nullable=False)
    model_version = Column(String(50), default="CivicAI-v1.0-Hybrid")
    prediction_date = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="predictions")


class ImportLog(Base):
    __tablename__ = "import_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_id = Column(String(36), ForeignKey("data_sources.id"), nullable=True)
    file_name = Column(String(255), nullable=False)
    imported_at = Column(DateTime, default=datetime.utcnow)
    records_processed = Column(Integer, default=0)
    records_accepted = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    data_origin = Column(String(50), default="OFFICIAL_REPORT_IMPORT")
    error_summary = Column(Text, nullable=True)

    source = relationship("DataSource", back_populates="import_logs")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False) # CREATE, UPDATE, DELETE, APPROVE, REVIEW, IMPORT
    record_type = Column(String(50), nullable=False)
    record_id = Column(String(100), nullable=False)
    action_timestamp = Column(DateTime, default=datetime.utcnow)
    change_summary = Column(Text, nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="citizen") # admin, reviewer, citizen
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
