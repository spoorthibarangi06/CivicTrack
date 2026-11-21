from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.models.entities import User, Project, ImportLog, AuditLog, Prediction, DataSource
from backend.app.security.auth import (
    verify_password, create_access_token, require_admin, get_current_user
)
from backend.app.schemas.project_schemas import Token
from backend.app.config import settings
from backend.app.importers.csv_excel_importer import DataImporter
from backend.app.connectors.gov_connectors import gov_registry
from backend.app.connectors.datagov_connector import datagov_connector

router = APIRouter()

@router.post("/auth/token", response_model=Token, tags=["Authentication"])
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Admin and Reviewer authentication endpoint returning JWT bearer token."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    token = create_access_token(data={"sub": user.username, "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username
    )


@router.post("/admin/import/csv", tags=["Administration"])
async def import_csv_projects(
    file: UploadFile = File(...),
    dry_run: bool = Form(False),
    source_id: Optional[str] = Form(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Imports Karnataka government CSV dataset with preview mode, column mapping,
    and duplicate detection.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported on this endpoint")

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 15MB limit")

    result = DataImporter.process_file(
        file_bytes=content,
        file_name=file.filename,
        db=db,
        dry_run=dry_run,
        source_id=source_id
    )
    return result


@router.post("/admin/import/excel", tags=["Administration"])
async def import_excel_projects(
    file: UploadFile = File(...),
    dry_run: bool = Form(False),
    source_id: Optional[str] = Form(None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Imports official .xlsx or .xls project registers."""
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx, .xls) files are accepted")

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 15MB limit")

    result = DataImporter.process_file(
        file_bytes=content,
        file_name=file.filename,
        db=db,
        dry_run=dry_run,
        source_id=source_id
    )
    return result


@router.post("/admin/sync", tags=["Administration"])
async def trigger_data_sync(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Executes synchronization probe across registered government data sources
    and executes official data ingestion fallback pipelines.
    """
    sync_results = []
    sources = db.query(DataSource).all()

    # 1. Probe live web status
    for src in sources:
        probe = await gov_registry.probe_source_status(src.source_url)
        if probe["reachable"]:
            src.last_successful_sync = datetime.utcnow()
            src.source_status = "ACTIVE"
        else:
            src.source_status = "UNAVAILABLE"

    db.commit()

    # 2. Execute source ingestion pipelines
    ingestion_reports = gov_registry.execute_all_ingestions(db)
    total_new_records = sum(r.get("records_imported", 0) for r in ingestion_reports)

    # 3. Log audit
    audit = AuditLog(
        user_id=admin.username,
        action="SYNC_TRIGGER_AND_INGEST",
        record_type="DATA_SOURCES",
        record_id="ALL",
        change_summary=f"Admin initiated synchronization check and official report ingestion. {total_new_records} records processed across sources."
    )
    db.add(audit)
    db.commit()

    return {
        "sync_completed": True,
        "timestamp": datetime.utcnow().isoformat(),
        "sources_checked": len(sources),
        "total_records_ingested": total_new_records,
        "ingestion_reports": ingestion_reports
    }


@router.post("/admin/projects/{project_id}/review", tags=["Administration"])
def review_project_anomaly(
    project_id: str,
    status_decision: str = Form(...), # RESOLVED, VERIFIED_ANOMALY, DISMISSED
    reviewer_notes: str = Form(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Allows administrators and data reviewers to resolve or substantiate flagged anomalies."""
    proj = db.query(Project).filter(Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    # Update or resolve predictions
    anomalies = db.query(Prediction).filter(
        Prediction.project_id == project_id,
        Prediction.prediction_type == "FINANCIAL_ANOMALY"
    ).all()

    for a in anomalies:
        if status_decision == "RESOLVED":
            a.explanation = f"[RESOLVED by {admin.username}] {reviewer_notes} (Original: {a.explanation})"
            a.risk_level = "LOW"
        else:
            a.explanation = f"[REVIEWED - {status_decision} by {admin.username}] {reviewer_notes}"

    audit = AuditLog(
        user_id=admin.username,
        action=f"ANOMALY_REVIEW_{status_decision}",
        record_type="PROJECT",
        record_id=project_id,
        change_summary=f"Reviewer notes: {reviewer_notes}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "project_id": project_id,
        "decision": status_decision,
        "reviewer": admin.username,
        "updated_at": datetime.utcnow().isoformat()
    }


@router.get("/admin/logs", tags=["Administration"])
def get_admin_logs(
    limit: int = 20,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Returns historical import logs and administrative audit trail."""
    import_logs = db.query(ImportLog).order_by(desc(ImportLog.imported_at)).limit(limit).all()
    audit_logs = db.query(AuditLog).order_by(desc(AuditLog.action_timestamp)).limit(limit).all()

    return {
        "import_logs": [
            {
                "id": i.id,
                "file_name": i.file_name,
                "imported_at": i.imported_at.isoformat(),
                "records_processed": i.records_processed,
                "records_accepted": i.records_accepted,
                "records_rejected": i.records_rejected,
                "error_summary": i.error_summary
            }
            for i in import_logs
        ],
        "audit_logs": [
            {
                "id": a.id,
                "user_id": a.user_id,
                "action": a.action,
                "record_type": a.record_type,
                "record_id": a.record_id,
                "action_timestamp": a.action_timestamp.isoformat(),
                "change_summary": a.change_summary
            }
            for a in audit_logs
        ]
    }


@router.get("/admin/datagov/catalog", tags=["data.gov.in Multi-Connector"])
def get_datagov_catalog(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns configured data.gov.in resource catalog including resource IDs,
    category classification, and current database record counts.
    API key is kept strictly on the backend.
    """
    return {
        "api_key_configured": bool(settings.DATA_GOV_IN_API_KEY),
        "total_datasets": len(datagov_connector.DATASETS),
        "datasets": datagov_connector.get_catalog(db)
    }


@router.post("/admin/datagov/fetch/{dataset_key}", tags=["data.gov.in Multi-Connector"])
async def fetch_datagov_dataset(
    dataset_key: str,
    dry_run: bool = Form(False),
    limit: int = Form(25),
    force_fallback: bool = Form(False),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Executes separate authenticated API request for a specific data.gov.in resource ID.
    If dry_run=True, previews returned fields and JSON records without database insertion.
    If dry_run=False, safely parses records, prevents duplicates, and labels origin LIVE_API or OFFICIAL_REPORT_IMPORT.
    """
    meta = datagov_connector.get_dataset_meta(dataset_key)
    if not meta:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset '{dataset_key}' not recognized. Available datasets: {list(datagov_connector.DATASETS.keys())}"
        )

    norm_key = datagov_connector.normalize_key(dataset_key)

    if dry_run:
        # Preview fields and sample records
        res = await datagov_connector.fetch_live_api(norm_key, limit=limit)
        return {
            "mode": "DRY_RUN_PREVIEW",
            "dataset_key": norm_key,
            "resource_id": meta["resource_id"],
            "api_endpoint": meta["api_endpoint"],
            "result": res
        }

    # Execute full sync (Live API first, official report fallback if endpoint times out or unauthenticated)
    sync_res = await datagov_connector.sync_dataset(norm_key, db, force_fallback=force_fallback)

    if not sync_res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sync failed for '{norm_key}': {sync_res.get('error', 'Unknown error during ingestion')}"
        )

    # Audit log
    audit = AuditLog(
        user_id=admin.username,
        action=f"DATAGOV_FETCH_{norm_key.upper()}",
        record_type="RESOURCE_ID",
        record_id=meta["resource_id"],
        change_summary=f"Admin initiated separate fetch for {meta['name']} (Resource {meta['resource_id']}). Mode: {sync_res.get('mode')}."
    )
    db.add(audit)
    db.commit()

    return sync_res


@router.post("/admin/datagov/fetch-all", tags=["data.gov.in Multi-Connector"])
async def fetch_all_datagov_datasets(
    force_fallback: bool = Form(False),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Executes sequential separate API requests across all 4 configured data.gov.in resources.
    """
    results = {}
    for key in datagov_connector.DATASETS.keys():
        res = await datagov_connector.sync_dataset(key, db, force_fallback=force_fallback)
        results[key] = res

    audit = AuditLog(
        user_id=admin.username,
        action="DATAGOV_FETCH_ALL_RESOURCES",
        record_type="RESOURCE_BATCH",
        record_id="DATA_GOV_IN_ALL",
        change_summary="Admin initiated batch fetch across all configured data.gov.in resource IDs."
    )
    db.add(audit)
    db.commit()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "datasets_synced": len(results),
        "results": results
    }
