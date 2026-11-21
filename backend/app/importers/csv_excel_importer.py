import io
from datetime import datetime, date
from typing import Dict, Any, List, Optional, Tuple
from decimal import Decimal
import pandas as pd
from sqlalchemy.orm import Session
from backend.app.models.entities import (
    Project, FinancialRecord, ProgressUpdate, ImportLog, AuditLog, DataSource
)
from backend.app.ml.delay_risk import delay_engine
from backend.app.ml.anomaly_detector import anomaly_detector

# Flexible column aliases dictionary
COLUMN_MAP = {
    "source_record_id": ["source_record_id", "project_id", "work_code", "activity_code", "tender_id", "id"],
    "project_name": ["project_name", "work_name", "activity_name", "tender_title", "title", "description"],
    "department": ["department", "dept", "implementing_agency", "executing_agency"],
    "district": ["district", "district_name", "dist"],
    "taluk": ["taluk", "taluk_name", "block", "mandal"],
    "gram_panchayat": ["gram_panchayat", "gp", "panchayat"],
    "village": ["village", "location", "hab"],
    "category": ["category", "sector", "work_type", "scheme"],
    "approved_budget": ["approved_budget", "sanction_cost", "estimated_cost", "budget", "approved_amount"],
    "expenditure_amount": ["expenditure_amount", "expenditure", "actual_spent", "funds_spent"],
    "released_amount": ["released_amount", "released", "funds_released", "sanctioned_amount"],
    "awarded_contract_value": ["awarded_contract_value", "contract_value", "awarded_value", "tender_cost"],
    "progress_percentage": ["progress_percentage", "progress", "physical_progress", "completion_percentage", "progress_pct"],
    "start_date": ["start_date", "commencement_date", "award_date"],
    "expected_end_date": ["expected_end_date", "target_completion_date", "completion_date", "due_date"],
    "latitude": ["latitude", "lat"],
    "longitude": ["longitude", "lng", "lon"],
    "project_status": ["project_status", "status", "activity_status", "work_status"],
    "financial_year": ["financial_year", "fy", "year"],
}

def normalize_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    """Maps varied government CSV headers to standard database attributes."""
    mapped_columns = {}
    col_lookup = {str(c).strip().lower().replace(" ", "_"): c for c in df.columns}
    
    renames = {}
    for standard_name, aliases in COLUMN_MAP.items():
        for alias in aliases:
            if alias in col_lookup:
                original_col = col_lookup[alias]
                renames[original_col] = standard_name
                mapped_columns[standard_name] = original_col
                break

    cleaned_df = df.rename(columns=renames)
    return cleaned_df, mapped_columns

def parse_date_safe(val: Any) -> Optional[date]:
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None
    try:
        dt = pd.to_datetime(val, errors="coerce")
        if pd.notna(dt):
            return dt.date()
    except Exception:
        pass
    return None

def parse_decimal_safe(val: Any) -> Optional[Decimal]:
    if pd.isna(val) or val is None or str(val).strip() == "" or str(val).strip().lower() in ["na", "n/a", "not available"]:
        return None
    try:
        clean_str = str(val).replace(",", "").replace("₹", "").replace("Rs.", "").strip()
        num = float(clean_str)
        return Decimal(f"{num:.2f}")
    except Exception:
        return None

def parse_float_safe(val: Any) -> Optional[float]:
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None
    try:
        clean_str = str(val).replace("%", "").strip()
        return float(clean_str)
    except Exception:
        return None

class DataImporter:
    @staticmethod
    def process_file(
        file_bytes: bytes,
        file_name: str,
        db: Session,
        dry_run: bool = False,
        source_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes CSV or Excel data with strict validation, duplicate detection,
        and audit tracking.
        """
        # Read into DataFrame
        try:
            if file_name.endswith(".xlsx") or file_name.endswith(".xls"):
                df = pd.read_excel(io.BytesIO(file_bytes))
            else:
                df = pd.read_csv(io.BytesIO(file_bytes))
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to parse file: {str(e)}",
                "processed": 0,
                "accepted": 0,
                "rejected": 0
            }

        total_rows = len(df)
        if total_rows == 0:
            return {"success": False, "error": "The uploaded file contains no data rows."}

        cleaned_df, mapped_cols = normalize_columns(df)
        
        # Check required columns
        required = ["source_record_id", "project_name", "district"]
        missing_required = [r for r in required if r not in cleaned_df.columns]
        if missing_required:
            return {
                "success": False,
                "error": f"Missing mandatory columns: {', '.join(missing_required)}. Found: {list(df.columns)}",
                "mapped_columns": mapped_cols
            }

        accepted_records = []
        errors = []
        duplicates = []
        preview_rows = []

        existing_ids = set(
            row[0] for row in db.query(Project.source_record_id).all()
        )

        for idx, row in cleaned_df.iterrows():
            row_num = idx + 2
            raw_id = str(row.get("source_record_id", "")).strip()
            name = str(row.get("project_name", "")).strip()
            district = str(row.get("district", "")).strip()

            if not raw_id or pd.isna(raw_id):
                errors.append(f"Row {row_num}: Missing project identifier")
                continue

            if not name or pd.isna(name):
                errors.append(f"Row {row_num}: Missing project name")
                continue

            if not district or pd.isna(district):
                errors.append(f"Row {row_num}: Missing district")
                continue

            is_duplicate = raw_id in existing_ids
            if is_duplicate:
                duplicates.append(raw_id)

            budget = parse_decimal_safe(row.get("approved_budget"))
            revised_b = parse_decimal_safe(row.get("revised_budget"))
            expenditure = parse_decimal_safe(row.get("expenditure_amount"))
            released = parse_decimal_safe(row.get("released_amount"))
            tender_val = parse_decimal_safe(row.get("tender_value"))
            contract_val = parse_decimal_safe(row.get("awarded_contract_value"))
            progress = parse_float_safe(row.get("progress_percentage"))
            start_d = parse_date_safe(row.get("start_date"))
            end_d = parse_date_safe(row.get("expected_end_date"))
            lat = parse_float_safe(row.get("latitude"))
            lng = parse_float_safe(row.get("longitude"))

            loc_precision = "EXACT" if (lat and lng) else "APPROXIMATE_DISTRICT"
            status = str(row.get("project_status", "ONGOING")).strip().upper()
            if status not in ["PLANNED", "ONGOING", "COMPLETED", "DELAYED", "SUSPENDED"]:
                status = "ONGOING"

            dept = str(row.get("department", "Rural Development & Panchayat Raj")).strip()
            category = str(row.get("category", "General Infrastructure")).strip()
            taluk = str(row.get("taluk", "")).strip() if pd.notna(row.get("taluk")) else None
            gp = str(row.get("gram_panchayat", "")).strip() if pd.notna(row.get("gram_panchayat")) else None
            village = str(row.get("village", "")).strip() if pd.notna(row.get("village")) else None
            fy = str(row.get("financial_year", "2024-25")).strip()

            record_dict = {
                "source_record_id": raw_id,
                "project_name": name,
                "department": dept,
                "district": district,
                "taluk": taluk,
                "gram_panchayat": gp,
                "village": village,
                "category": category,
                "approved_budget": budget,
                "revised_budget": revised_b,
                "expenditure_amount": expenditure,
                "released_amount": released,
                "tender_value": tender_val,
                "awarded_contract_value": contract_val,
                "progress_percentage": progress,
                "start_date": start_d,
                "expected_end_date": end_d,
                "latitude": lat,
                "longitude": lng,
                "location_precision": loc_precision,
                "project_status": status,
                "financial_year": fy,
                "is_duplicate": is_duplicate,
            }
            accepted_records.append(record_dict)

            if len(preview_rows) < 10:
                preview_rows.append({
                    "id": raw_id,
                    "name": name,
                    "district": district,
                    "budget": float(budget) if budget else "Not available in source",
                    "status": status,
                    "is_duplicate": is_duplicate
                })

        if dry_run:
            return {
                "success": True,
                "dry_run": True,
                "file_name": file_name,
                "total_rows": total_rows,
                "valid_records": len(accepted_records),
                "duplicate_count": len(duplicates),
                "error_count": len(errors),
                "errors": errors[:15],
                "mapped_columns": mapped_cols,
                "preview_sample": preview_rows
            }

        # Commit to Database
        committed_count = 0
        for rec in accepted_records:
            # If project exists, update or skip duplicate
            proj = db.query(Project).filter(Project.source_record_id == rec["source_record_id"]).first()
            if not proj:
                origin_val = "OFFICIAL_REPORT_IMPORT" if source_id else "SAMPLE_DATA"
                proj = Project(
                    source_id=source_id,
                    source_record_id=rec["source_record_id"],
                    project_name=rec["project_name"],
                    department=rec["department"],
                    district=rec["district"],
                    taluk=rec["taluk"],
                    gram_panchayat=rec["gram_panchayat"],
                    village=rec["village"],
                    category=rec["category"],
                    approved_budget=rec["approved_budget"],
                    revised_budget=rec["revised_budget"],
                    start_date=rec["start_date"],
                    expected_end_date=rec["expected_end_date"],
                    latitude=rec["latitude"],
                    longitude=rec["longitude"],
                    location_precision=rec["location_precision"],
                    project_status=rec["project_status"],
                    data_origin=origin_val,
                    retrieval_timestamp=datetime.utcnow()
                )
                db.add(proj)
                db.flush()
            else:
                # Update status and dates if provided
                proj.project_status = rec["project_status"]
                if rec["approved_budget"]:
                    proj.approved_budget = rec["approved_budget"]
                if rec["revised_budget"]:
                    proj.revised_budget = rec["revised_budget"]
                if rec["expected_end_date"]:
                    proj.expected_end_date = rec["expected_end_date"]
                if source_id:
                    proj.data_origin = "OFFICIAL_REPORT_IMPORT"
                    proj.retrieval_timestamp = datetime.utcnow()
                db.flush()

            # Add financial record if numbers provided (Preserves tender value distinct from expenditure)
            if rec["expenditure_amount"] is not None or rec["released_amount"] is not None or rec["tender_value"] is not None:
                fin = FinancialRecord(
                    project_id=proj.id,
                    source_id=source_id,
                    financial_year=rec["financial_year"],
                    approved_amount=rec["approved_budget"],
                    released_amount=rec["released_amount"],
                    expenditure_amount=rec["expenditure_amount"],
                    awarded_contract_value=rec["awarded_contract_value"],
                    tender_value=rec["tender_value"],
                    reporting_date=date.today(),
                    source_record_id=rec["source_record_id"],
                )
                db.add(fin)

            # Add progress update if provided
            if rec["progress_percentage"] is not None:
                prog = ProgressUpdate(
                    project_id=proj.id,
                    progress_percentage=rec["progress_percentage"],
                    reported_status=rec["project_status"],
                    reporting_date=date.today(),
                    source_id=source_id,
                    source_record_id=rec["source_record_id"],
                )
                db.add(prog)

            committed_count += 1

        # Create Import Log
        log = ImportLog(
            source_id=source_id,
            file_name=file_name,
            records_processed=total_rows,
            records_accepted=committed_count,
            records_rejected=len(errors),
            data_origin="OFFICIAL_REPORT_IMPORT" if source_id else "SAMPLE_DATA",
            error_summary="; ".join(errors[:10]) if errors else "Import successful"
        )
        db.add(log)

        # Audit Log
        audit = AuditLog(
            user_id="admin",
            action="IMPORT",
            record_type="PROJECT_BATCH",
            record_id=file_name,
            change_summary=f"Imported {committed_count} records from {file_name}"
        )
        db.add(audit)
        db.commit()

        return {
            "success": True,
            "dry_run": False,
            "file_name": file_name,
            "records_processed": total_rows,
            "records_accepted": committed_count,
            "records_rejected": len(errors),
            "errors": errors[:10]
        }
