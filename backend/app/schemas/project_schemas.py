from typing import Optional, List, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal

class DataSourceBase(BaseModel):
    source_name: str
    source_url: str
    source_type: str
    access_method: Optional[str] = "PUBLIC_DOWNLOAD"
    update_frequency: Optional[str] = "MONTHLY"
    source_status: Optional[str] = "ACTIVE"

class DataSourceOut(DataSourceBase):
    id: str
    last_successful_sync: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class FinancialRecordOut(BaseModel):
    id: str
    project_id: Optional[str] = None
    financial_year: str
    approved_amount: Optional[Decimal] = None
    released_amount: Optional[Decimal] = None
    expenditure_amount: Optional[Decimal] = None
    awarded_contract_value: Optional[Decimal] = None
    tender_value: Optional[Decimal] = None
    reporting_date: Optional[date] = None
    source_record_id: Optional[str] = None
    source_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ProgressUpdateOut(BaseModel):
    id: str
    project_id: str
    progress_percentage: float
    progress_description: Optional[str] = None
    reported_status: Optional[str] = None
    reporting_date: Optional[date] = None
    source_record_id: Optional[str] = None
    source_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ProjectDocumentOut(BaseModel):
    id: str
    project_id: str
    document_type: str
    document_url: str
    document_title: str
    publication_date: Optional[date] = None
    model_config = ConfigDict(from_attributes=True)


class PredictionOut(BaseModel):
    id: str
    project_id: str
    prediction_type: str
    risk_score: Optional[float] = None
    risk_level: str
    explanation: str
    model_version: str
    prediction_date: datetime
    model_config = ConfigDict(from_attributes=True)


class ProjectSummary(BaseModel):
    id: str
    source_id: Optional[str] = None
    source_record_id: str
    project_name: str
    department: str
    district: str
    taluk: Optional[str] = None
    gram_panchayat: Optional[str] = None
    village: Optional[str] = None
    category: str
    approved_budget: Optional[Decimal] = None
    revised_budget: Optional[Decimal] = None
    latest_expenditure: Optional[Decimal] = None
    latest_released_amount: Optional[Decimal] = None
    latest_tender_value: Optional[Decimal] = None
    latest_progress: Optional[float] = None
    reporting_date: Optional[date] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_precision: str
    project_status: str
    data_origin: Optional[str] = "SAMPLE_DATA"
    retrieval_timestamp: Optional[datetime] = None
    delay_risk_level: Optional[str] = None
    financial_anomaly_flag: Optional[bool] = False
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class ProjectDetail(ProjectSummary):
    financial_records: List[FinancialRecordOut] = []
    progress_updates: List[ProgressUpdateOut] = []
    documents: List[ProjectDocumentOut] = []
    predictions: List[PredictionOut] = []
    data_quality_notes: Optional[str] = None


class PaginatedProjects(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    projects: List[ProjectSummary]


class ProjectMapItem(BaseModel):
    id: str
    project_name: str
    department: str
    district: str
    taluk: Optional[str] = None
    category: str
    approved_budget: Optional[Decimal] = None
    latest_progress: Optional[float] = None
    project_status: str
    latitude: float
    longitude: float
    location_precision: str
    data_origin: Optional[str] = "SAMPLE_DATA"
    risk_level: Optional[str] = None


class OverviewKPI(BaseModel):
    total_projects_tracked: int
    total_approved_budget: Decimal
    total_reported_expenditure: Decimal
    completed_projects_count: int
    ongoing_projects_count: int
    delay_risk_projects_count: int
    financial_review_projects_count: int
    recently_updated: List[ProjectSummary] = []
    recently_flagged: List[ProjectSummary] = []


class DistrictStat(BaseModel):
    district: str
    project_count: int
    approved_budget: Decimal
    reported_expenditure: Decimal
    avg_progress: float
    high_risk_count: int


class DepartmentStat(BaseModel):
    department: str
    project_count: int
    approved_budget: Decimal
    reported_expenditure: Decimal
    completed_count: int
    ongoing_count: int


class AnomalyReport(BaseModel):
    project_id: str
    project_name: str
    district: str
    department: str
    flag_type: str
    risk_level: str
    reason: str
    approved_budget: Optional[Decimal] = None
    reported_expenditure: Optional[Decimal] = None
    reported_progress: Optional[float] = None
    source_portal: Optional[str] = None
    source_url: Optional[str] = None
    reporting_date: Optional[date] = None
    data_origin: Optional[str] = "SAMPLE_DATA"
    limitations_note: Optional[str] = "Statistical indicator generated automatically. Does not constitute an audit finding or evidence of wrongdoing."
    review_status: str = "PENDING_REVIEW"


class UserAuth(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
