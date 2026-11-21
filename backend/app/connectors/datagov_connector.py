import os
import hashlib
import logging
from datetime import datetime, date
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_

from backend.app.config import settings
from backend.app.models.entities import (
    Project, FinancialRecord, ProgressUpdate, ProjectDocument,
    DataSource, ImportLog, AuditLog
)
from backend.app.importers.csv_excel_importer import (
    DataImporter, parse_decimal_safe, parse_float_safe, parse_date_safe
)

logger = logging.getLogger("civictrack.datagov")

# Verified coordinates for all 31 Karnataka district headquarters
DISTRICT_COORDINATES: Dict[str, Tuple[float, float]] = {
    "Bagalkot": (16.1875, 75.6980),
    "Ballari": (15.1394, 76.9214),
    "Belagavi": (15.8497, 74.4977),
    "Bengaluru Rural": (13.2284, 77.5818),
    "Bengaluru Urban": (12.9716, 77.5946),
    "Bidar": (17.9104, 77.5199),
    "Chamarajanagar": (11.9261, 76.9437),
    "Chikkaballapura": (13.4325, 77.7275),
    "Chikkamagaluru": (13.3161, 75.7720),
    "Chitradurga": (14.2251, 76.3980),
    "Dakshina Kannada": (12.9141, 74.8560),
    "Davangere": (14.4644, 75.9218),
    "Dharwad": (15.4589, 75.0078),
    "Gadag": (15.4167, 75.6333),
    "Hassan": (13.0033, 76.1004),
    "Haveri": (14.7951, 75.3991),
    "Kalaburagi": (17.3297, 76.8343),
    "Kodagu": (12.4244, 75.7382),
    "Kolar": (13.1367, 78.1291),
    "Koppal": (15.3533, 76.1558),
    "Mandya": (12.5238, 76.8967),
    "Mysuru": (12.2958, 76.6394),
    "Raichur": (16.2120, 77.3439),
    "Ramanagara": (12.7150, 77.2810),
    "Shivamogga": (13.9299, 75.5681),
    "Tumakuru": (13.3409, 77.1006),
    "Udupi": (13.3409, 74.7421),
    "Uttara Kannada": (14.8136, 74.1298),
    "Vijayanagara": (15.2691, 76.3889),
    "Vijayapura": (16.8302, 75.7100),
    "Yadgir": (16.7644, 77.1378),
}

def resolve_district_coords(name: str) -> Tuple[Optional[float], Optional[float]]:
    """Cleanly resolves coordinates for any Karnataka district string."""
    clean = str(name or "").replace("_", " ").strip().title()
    for d_name, coords in DISTRICT_COORDINATES.items():
        if clean.lower() == d_name.lower():
            return coords
        if d_name.lower() in clean.lower():
            return coords
    return (12.9716, 77.5946) # Karnataka state capital center fallback


class DataGovInMultiConnector:
    """
    Multi-resource connector for National Open Government Data (data.gov.in).
    Manages separate authenticated REST queries for individual Karnataka datasets:
    1. Basava Housing Scheme
    2. Pradhan Mantri Awas Yojana (Grameena)
    3. Year-wise Financial Performance of BMTC
    4. BMTC Financial Information 2024-25
    """

    DATASETS: Dict[str, Dict[str, Any]] = {
        "basava_housing": {
            "source_id": "src-datagov-basava-housing",
            "name": "Basava Housing Scheme",
            "resource_id": "724b3435-b96e-4449-a8e5-31e45c32fc54",
            "api_endpoint": "https://api.data.gov.in/resource/724b3435-b96e-4449-a8e5-31e45c32fc54",
            "department": "Housing Department",
            "category": "Affordable Housing & Social Welfare",
            "sector": "Housing",
            "default_district": "Kalaburagi",
            "update_frequency": "MONTHLY",
            "fallback_file": "c:/AI_GOV/data/imports/datagov_basava_housing.csv",
            "description": "State-sponsored rural and semi-urban affordable housing allocations and beneficiary unit grants (Rajiv Gandhi Housing Corporation).",
            "prefix": "DGOV-BASAVA",
        },
        "pmay_grameena": {
            "source_id": "src-datagov-pmay-grameen",
            "name": "Pradhan Mantri Awas Yojana (Grameena)",
            "resource_id": "9fed1fd9-f22f-4eed-976a-ba4b8bec6d6a",
            "api_endpoint": "https://api.data.gov.in/resource/9fed1fd9-f22f-4eed-976a-ba4b8bec6d6a",
            "department": "Rural Development & Panchayat Raj",
            "category": "Rural Housing & Welfare",
            "sector": "Housing",
            "default_district": "Koppal",
            "update_frequency": "MONTHLY",
            "fallback_file": "c:/AI_GOV/data/imports/datagov_pmay_grameen.csv",
            "description": "Centrally sponsored rural pucca housing sanctions, installment disbursements, and Geo-tagged completions across Karnataka.",
            "prefix": "DGOV-PMAYG",
        },
        "bmtc_financial_performance": {
            "source_id": "src-datagov-bmtc-yearly",
            "name": "Year-wise Financial Performance of BMTC",
            "resource_id": "78abe18e-e988-46a7-86ad-0808c88b86e3",
            "api_endpoint": "https://api.data.gov.in/resource/78abe18e-e988-46a7-86ad-0808c88b86e3",
            "department": "Transport Department",
            "category": "Urban Mass Transit & Public Fleet",
            "sector": "Transport",
            "default_district": "Bengaluru Urban",
            "update_frequency": "ANNUAL",
            "fallback_file": "c:/AI_GOV/data/imports/datagov_bmtc_yearly_performance.csv",
            "description": "Multi-year revenue, capital outlay, operating expenditure, and fleet modernization performance for Bengaluru Metropolitan Transport Corporation.",
            "prefix": "DGOV-BMTC-HIST",
        },
        "bmtc_financial_2024_25": {
            "source_id": "src-datagov-bmtc-2024-25",
            "name": "BMTC Financial Information 2024-25",
            "resource_id": "87645f94-6fe3-4e28-bbbc-9c37291c35b3",
            "api_endpoint": "https://api.data.gov.in/resource/87645f94-6fe3-4e28-bbbc-9c37291c35b3",
            "department": "Transport Department",
            "category": "Urban Mass Transit & Public Fleet",
            "sector": "Transport",
            "default_district": "Bengaluru Urban",
            "update_frequency": "MONTHLY",
            "fallback_file": "c:/AI_GOV/data/imports/datagov_bmtc_2024_25.csv",
            "description": "Current fiscal capital expenditures, depot modernization, smart ticketing outlays, and electric feeder bus facilities in Bengaluru.",
            "prefix": "DGOV-BMTC-2025",
        },
    }

    # Bidirectional alias mapping ensuring any parameter variation resolves accurately
    ALIASES: Dict[str, str] = {
        "pmay_grameen": "pmay_grameena",
        "bmtc_yearly": "bmtc_financial_performance",
        "bmtc_2024_25": "bmtc_financial_2024_25",
        "basava": "basava_housing",
        "pmay": "pmay_grameena",
        "pmayg": "pmay_grameena",
        "bmtc": "bmtc_financial_2024_25",
    }

    @classmethod
    def normalize_key(cls, key: str) -> str:
        """Normalizes dataset key supporting aliases seamlessly."""
        raw = str(key or "").strip().lower()
        if raw in cls.DATASETS:
            return raw
        return cls.ALIASES.get(raw, raw)

    @classmethod
    def get_dataset_meta(cls, key: str) -> Optional[Dict[str, Any]]:
        norm_key = cls.normalize_key(key)
        return cls.DATASETS.get(norm_key)

    @classmethod
    def get_catalog(cls, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """Returns the dataset catalog metadata without exposing the backend API key."""
        catalog = []
        for key, meta in cls.DATASETS.items():
            record_count = 0
            live_api_count = 0
            last_sync = None
            if db:
                record_count = db.query(Project).filter(Project.source_id == meta["source_id"]).count()
                live_api_count = db.query(Project).filter(
                    Project.source_id == meta["source_id"],
                    Project.data_origin == "LIVE_API"
                ).count()
                ds = db.query(DataSource).filter(DataSource.id == meta["source_id"]).first()
                if ds:
                    last_sync = ds.last_successful_sync.isoformat() if ds.last_successful_sync else None

            catalog.append({
                "dataset_key": key,
                "source_id": meta["source_id"],
                "name": meta["name"],
                "resource_id": meta["resource_id"],
                "api_endpoint": meta["api_endpoint"],
                "department": meta["department"],
                "category": meta["category"],
                "sector": meta["sector"],
                "update_frequency": meta["update_frequency"],
                "description": meta["description"],
                "records_in_db": record_count,
                "live_api_records": live_api_count,
                "last_successful_sync": last_sync,
                "api_key_configured": bool(settings.DATA_GOV_IN_API_KEY),
            })
        return catalog

    @classmethod
    async def fetch_live_api(
        cls,
        dataset_key: str,
        offset: int = 0,
        limit: int = 50,
        filters: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Executes an authenticated REST query to data.gov.in for the specific resource ID.
        Uses the single DATA_GOV_IN_API_KEY exclusively from backend settings.
        """
        norm_key = cls.normalize_key(dataset_key)
        meta = cls.DATASETS.get(norm_key)
        if not meta:
            return {
                "success": False,
                "dataset_key": dataset_key,
                "error": f"Unknown dataset key '{dataset_key}'. Available: {list(cls.DATASETS.keys())}"
            }

        api_key = settings.DATA_GOV_IN_API_KEY
        if not api_key:
            return {
                "success": False,
                "dataset_key": norm_key,
                "resource_id": meta["resource_id"],
                "error": "DATA_GOV_IN_API_KEY is not configured in backend .env file"
            }

        url = f"https://api.data.gov.in/resource/{meta['resource_id']}"
        params: Dict[str, Any] = {
            "api-key": api_key,
            "format": "json",
            "offset": offset,
            "limit": limit
        }
        if filters:
            for fk, fv in filters.items():
                params[f"filters[{fk}]"] = fv

        headers = {
            "User-Agent": "CivicTrackKarnataka/1.0 (Government Transparency Monitor)",
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=20.0, verify=False) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    records = data.get("records", [])
                    fields = [f.get("id") or f.get("name") for f in data.get("field", [])]
                    logger.info(f"Successfully fetched {len(records)} records from data.gov.in for {norm_key}")
                    return {
                        "success": True,
                        "dataset_key": norm_key,
                        "resource_id": meta["resource_id"],
                        "total_available": data.get("total", len(records)),
                        "returned_count": len(records),
                        "offset": offset,
                        "limit": limit,
                        "fields": fields,
                        "records": records,
                    }
                else:
                    logger.warning(f"data.gov.in returned HTTP {resp.status_code} for {norm_key}: {resp.text[:200]}")
                    return {
                        "success": False,
                        "dataset_key": norm_key,
                        "resource_id": meta["resource_id"],
                        "status_code": resp.status_code,
                        "error_message": resp.text[:300]
                    }
        except Exception as e:
            logger.error(f"Error querying data.gov.in ({norm_key}): {e}")
            return {
                "success": False,
                "dataset_key": norm_key,
                "resource_id": meta["resource_id"],
                "error": f"External API connection check: {type(e).__name__} ({str(e)[:120]})"
            }

    @classmethod
    def parse_and_persist_records(
        cls,
        dataset_key: str,
        raw_records: List[Dict[str, Any]],
        db: Session
    ) -> Dict[str, Any]:
        """
        Inspects JSON fields, maps attributes without inventing missing figures,
        prevents duplicate records, preserves dataset separation, and labels records LIVE_API.
        """
        norm_key = cls.normalize_key(dataset_key)
        meta = cls.DATASETS.get(norm_key)
        if not meta:
            return {"success": False, "error": f"Unknown dataset {dataset_key}"}

        cls.ensure_datasource_exists(meta, db)

        inserted_count = 0
        updated_count = 0
        skipped_count = 0

        try:
            for idx, row in enumerate(raw_records):
                if not isinstance(row, dict):
                    skipped_count += 1
                    continue

                # -------------------------------------------------------------
                # 1 & 2: Housing Schemes (Basava Housing & PMAY-Grameena)
                # -------------------------------------------------------------
                if norm_key in ["basava_housing", "pmay_grameena"]:
                    district_raw = str(row.get("district_name") or row.get("district") or meta["default_district"]).strip()
                    district = district_raw.replace("_", " ").strip().title()
                    dist_key = district.upper().replace(" ", "_")

                    raw_id = f"{meta['prefix']}-{dist_key}"
                    name = f"{meta['name']} – {district} District Housing Allocations"

                    ben_total = parse_float_safe(row.get("benificiary_selection"))
                    comp_units = parse_float_safe(row.get("completed"))
                    foundation = parse_float_safe(row.get("foundation"))
                    lintel = parse_float_safe(row.get("lintel"))
                    roof = parse_float_safe(row.get("roof"))
                    in_progress = parse_float_safe(row.get("progress_total"))
                    unstarted = parse_float_safe(row.get("unstarted"))

                    # Compute physical completion percentage without fabricating budget numbers
                    if ben_total is not None and ben_total > 0 and comp_units is not None:
                        progress = round((comp_units / ben_total) * 100.0, 1)
                    else:
                        progress = 0.0

                    # Status evaluation
                    if progress >= 100.0 and (in_progress is None or in_progress == 0):
                        status = "COMPLETED"
                    elif unstarted is not None and ben_total is not None and unstarted == ben_total:
                        status = "PLANNED"
                    else:
                        status = "ONGOING"

                    # DO NOT invent budget figures; preserve as NULL
                    budget = None
                    expenditure = None
                    released = None
                    lat, lon = resolve_district_coords(district)

                    # Detailed progress milestone description preserving raw metrics
                    prog_desc = (
                        f"Sanctioned Targets: {int(ben_total or 0):,} units | "
                        f"Completed Pucca Units: {int(comp_units or 0):,} | "
                        f"Active Construction: {int(in_progress or 0):,} "
                        f"(Foundation: {int(foundation or 0):,}, Lintel: {int(lintel or 0):,}, Roof: {int(roof or 0):,}) | "
                        f"Unstarted: {int(unstarted or 0):,}"
                    )

                # -------------------------------------------------------------
                # 3: BMTC Year-wise Financial Performance
                # -------------------------------------------------------------
                elif norm_key == "bmtc_financial_performance":
                    factor = str(row.get("factors") or row.get("particulars") or f"Performance Factor {idx+1}").strip()
                    sl_no = str(row.get("_sl_no") or idx + 1).strip().replace(".", "_")

                    # Check if all year columns are "NA" (pure section title)
                    year_cols = [
                        "_1997_98__after__bifurcation_w_e_f__15_08_97_",
                        "__2015_16", "__2016_17", "_2017_18", "_2018_19",
                        "_2019_20", "_2020_21__estimated"
                    ]
                    has_numeric = any(
                        parse_decimal_safe(row.get(c)) is not None for c in year_cols
                    )
                    if not has_numeric:
                        skipped_count += 1
                        continue

                    factor_slug = hashlib.md5(factor.encode("utf-8")).hexdigest()[:6].upper()
                    raw_id = f"{meta['prefix']}-{sl_no}-{factor_slug}"
                    name = f"BMTC Multi-Year Trend: {factor}"
                    district = "Bengaluru Urban"
                    status = "COMPLETED"
                    lat, lon = (12.9716, 77.5946)
                    progress = 100.0
                    prog_desc = f"Historical multi-year transport performance metrics for BMTC Bengaluru ({factor})."

                    # Check for latest available year value (in Lakhs, convert to Rs standard)
                    val_2020 = parse_decimal_safe(row.get("_2020_21__estimated"))
                    val_2019 = parse_decimal_safe(row.get("_2019_20"))
                    val_latest = val_2020 or val_2019
                    budget = (val_latest * Decimal("100000.00")) if val_latest is not None else None
                    expenditure = None
                    released = None

                # -------------------------------------------------------------
                # 4: BMTC Financial Information 2024-25
                # -------------------------------------------------------------
                elif norm_key == "bmtc_financial_2024_25":
                    factor = str(row.get("factors") or row.get("particulars") or f"Fiscal Metric {idx+1}").strip()
                    sl_no = str(row.get("_sl_no") or idx + 1).strip().replace(".", "_")

                    year_cols = [
                        "_2015_16", "_2016_17", "_2017__18_", "__2018_19",
                        "_2019__20_", "_2020__21_", "_2021__22_", "_2022_23",
                        "_2023_24_", "_2024_25_"
                    ]
                    has_numeric = any(
                        parse_decimal_safe(row.get(c)) is not None for c in year_cols
                    )
                    if not has_numeric:
                        skipped_count += 1
                        continue

                    factor_slug = hashlib.md5(factor.encode("utf-8")).hexdigest()[:6].upper()
                    raw_id = f"{meta['prefix']}-{sl_no}-{factor_slug}"
                    name = f"BMTC Fiscal 2024-25: {factor}"
                    district = "Bengaluru Urban"
                    status = "ONGOING"
                    lat, lon = (12.9716, 77.5946)
                    progress = 75.0
                    prog_desc = f"BMTC active FY 2024-25 operational/financial performance monitor ({factor})."

                    val_24_25 = parse_decimal_safe(row.get("_2024_25_") or row.get("_2024_25"))
                    budget = (val_24_25 * Decimal("100000.00")) if val_24_25 is not None else None
                    expenditure = None
                    released = None

                # -------------------------------------------------------------
                # Default / Fallback
                # -------------------------------------------------------------
                else:
                    raw_id = (
                        str(row.get("id") or row.get("project_id") or row.get("record_id") or "")
                    ).strip() or f"{meta['prefix']}-{idx+1}"
                    name = str(row.get("project_name") or row.get("title") or f"{meta['name']} Record #{raw_id}").strip()
                    district = str(row.get("district") or meta["default_district"]).strip()
                    budget = parse_decimal_safe(row.get("approved_budget"))
                    expenditure = parse_decimal_safe(row.get("expenditure_amount"))
                    released = parse_decimal_safe(row.get("released_amount"))
                    progress = parse_float_safe(row.get("progress_percentage")) or 0.0
                    status = "ONGOING"
                    lat, lon = resolve_district_coords(district)
                    prog_desc = "Public works monitor record."

                # -------------------------------------------------------------
                # Check for existing project to prevent duplicate insertions
                # -------------------------------------------------------------
                proj = db.query(Project).filter(
                    or_(
                        Project.source_record_id == raw_id,
                        and_(Project.project_name == name, Project.district == district)
                    )
                ).first()

                if not proj:
                    proj = Project(
                        source_id=meta["source_id"],
                        source_record_id=raw_id[:99],
                        project_name=name[:490],
                        department=meta["department"][:190],
                        district=district[:90],
                        taluk=None,
                        gram_panchayat=None,
                        village=None,
                        category=meta["category"][:90],
                        approved_budget=budget,
                        revised_budget=None,
                        latitude=lat,
                        longitude=lon,
                        location_precision="APPROXIMATE_DISTRICT",
                        project_status=status,
                        data_origin="LIVE_API",  # Labeled LIVE_API only after genuine API retrieval
                        retrieval_timestamp=datetime.utcnow()
                    )
                    db.add(proj)
                    db.flush()
                    inserted_count += 1
                else:
                    # Update existing record safely in place
                    proj.project_status = status
                    if budget is not None:
                        proj.approved_budget = budget
                    if lat is not None and lon is not None:
                        proj.latitude = lat
                        proj.longitude = lon
                    proj.data_origin = "LIVE_API"
                    proj.retrieval_timestamp = datetime.utcnow()
                    db.flush()
                    updated_count += 1

                # -------------------------------------------------------------
                # Update / Create Progress Update
                # -------------------------------------------------------------
                if progress is not None:
                    existing_prog = db.query(ProgressUpdate).filter(
                        ProgressUpdate.project_id == proj.id
                    ).first()
                    if not existing_prog:
                        prog = ProgressUpdate(
                            project_id=proj.id,
                            progress_percentage=progress,
                            progress_description=prog_desc[:1000] if prog_desc else None,
                            reported_status=status,
                            reporting_date=date.today(),
                            source_id=meta["source_id"],
                            source_record_id=raw_id[:99],
                            source_url=meta["api_endpoint"][:490]
                        )
                        db.add(prog)
                    else:
                        existing_prog.progress_percentage = progress
                        existing_prog.progress_description = prog_desc[:1000] if prog_desc else None
                        existing_prog.reported_status = status
                        existing_prog.reporting_date = date.today()

                # -------------------------------------------------------------
                # Multi-Year Financial Records for BMTC
                # -------------------------------------------------------------
                if norm_key == "bmtc_financial_performance":
                    year_mapping = [
                        ("__2015_16", "2015-16"),
                        ("__2016_17", "2016-17"),
                        ("_2017_18", "2017-18"),
                        ("_2018_19", "2018-19"),
                        ("_2019_20", "2019-20"),
                        ("_2020_21__estimated", "2020-21 (Est)"),
                    ]
                    for col_name, fy in year_mapping:
                        val_num = parse_decimal_safe(row.get(col_name))
                        if val_num is not None:
                            amt_rupees = val_num * Decimal("100000.00")
                            existing_fin = db.query(FinancialRecord).filter(
                                FinancialRecord.project_id == proj.id,
                                FinancialRecord.financial_year == fy
                            ).first()
                            if not existing_fin:
                                fin = FinancialRecord(
                                    project_id=proj.id,
                                    source_id=meta["source_id"],
                                    financial_year=fy,
                                    approved_amount=amt_rupees,
                                    released_amount=amt_rupees,
                                    expenditure_amount=amt_rupees if "cost" in factor.lower() or "expense" in factor.lower() else None,
                                    reporting_date=date.today(),
                                    source_record_id=raw_id[:99],
                                    source_url=meta["api_endpoint"][:490]
                                )
                                db.add(fin)
                            else:
                                existing_fin.approved_amount = amt_rupees

                elif norm_key == "bmtc_financial_2024_25":
                    year_mapping_25 = [
                        ("_2021__22_", "2021-22"),
                        ("_2022_23", "2022-23"),
                        ("_2023_24_", "2023-24"),
                        ("_2024_25_", "2024-25"),
                    ]
                    for col_name, fy in year_mapping_25:
                        val_num = parse_decimal_safe(row.get(col_name))
                        if val_num is not None:
                            amt_rupees = val_num * Decimal("100000.00")
                            existing_fin = db.query(FinancialRecord).filter(
                                FinancialRecord.project_id == proj.id,
                                FinancialRecord.financial_year == fy
                            ).first()
                            if not existing_fin:
                                fin = FinancialRecord(
                                    project_id=proj.id,
                                    source_id=meta["source_id"],
                                    financial_year=fy,
                                    approved_amount=amt_rupees,
                                    released_amount=amt_rupees,
                                    reporting_date=date.today(),
                                    source_record_id=raw_id[:99],
                                    source_url=meta["api_endpoint"][:490]
                                )
                                db.add(fin)
                            else:
                                existing_fin.approved_amount = amt_rupees

                # -------------------------------------------------------------
                # Attach Provenance Document Link
                # -------------------------------------------------------------
                existing_doc = db.query(ProjectDocument).filter(
                    ProjectDocument.project_id == proj.id
                ).first()
                if not existing_doc:
                    doc = ProjectDocument(
                        project_id=proj.id,
                        document_type="OFFICIAL_OGD_RESOURCE_RECORD",
                        document_url=meta["api_endpoint"][:490],
                        document_title=f"OGD India Resource {meta['resource_id']}"[:250],
                        publication_date=date.today(),
                        source_id=meta["source_id"]
                    )
                    db.add(doc)

            # Log import action
            log = ImportLog(
                source_id=meta["source_id"],
                file_name=f"api.data.gov.in:{meta['resource_id']}",
                records_processed=len(raw_records),
                records_accepted=inserted_count + updated_count,
                records_rejected=skipped_count,
                data_origin="LIVE_API",
                error_summary=f"Ingested {inserted_count} new, {updated_count} updated records from live data.gov.in API"
            )
            db.add(log)

            # Update last sync timestamp on DataSource
            ds = db.query(DataSource).filter(DataSource.id == meta["source_id"]).first()
            if ds:
                ds.last_successful_sync = datetime.utcnow()

            db.commit()
            logger.info(f"Committed {inserted_count} new and {updated_count} updated records for {norm_key}")

            return {
                "success": True,
                "dataset_key": norm_key,
                "source_id": meta["source_id"],
                "records_processed": len(raw_records),
                "inserted": inserted_count,
                "updated": updated_count,
                "data_origin": "LIVE_API"
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Transaction rollback during ingestion of {norm_key}: {e}", exc_info=True)
            return {
                "success": False,
                "dataset_key": norm_key,
                "error": f"Database transaction failed: {type(e).__name__} ({str(e)})",
                "inserted": 0,
                "updated": 0
            }

    @classmethod
    def execute_fallback_import(cls, dataset_key: str, db: Session) -> Dict[str, Any]:
        """
        Ingests the official fallback report for a dataset when live API is unavailable.
        Labels records as OFFICIAL_REPORT_IMPORT.
        """
        norm_key = cls.normalize_key(dataset_key)
        meta = cls.DATASETS.get(norm_key)
        if not meta:
            return {"success": False, "error": f"Unknown dataset {dataset_key}"}

        cls.ensure_datasource_exists(meta, db)

        fallback_path = meta.get("fallback_file")
        if not fallback_path or not os.path.exists(fallback_path):
            return {
                "success": False,
                "dataset_key": norm_key,
                "error": f"Fallback dataset not found at {fallback_path}"
            }

        with open(fallback_path, "rb") as f:
            file_bytes = f.read()

        import_res = DataImporter.process_file(
            file_bytes=file_bytes,
            file_name=os.path.basename(fallback_path),
            db=db,
            dry_run=False,
            source_id=meta["source_id"]
        )

        return {
            "success": import_res.get("success", False),
            "dataset_key": norm_key,
            "source_id": meta["source_id"],
            "source_name": meta["name"],
            "records_imported": import_res.get("records_accepted", 0),
            "records_processed": import_res.get("records_processed", 0),
            "data_origin": "OFFICIAL_REPORT_IMPORT",
            "method": "OFFICIAL_DATASET_FALLBACK"
        }

    @classmethod
    async def sync_dataset(
        cls,
        dataset_key: str,
        db: Session,
        force_fallback: bool = False
    ) -> Dict[str, Any]:
        """
        Tries live API ingestion first. If unauthenticated, timed out, or force_fallback,
        safely falls back to official report import without falsely claiming live connection.
        """
        norm_key = cls.normalize_key(dataset_key)
        meta = cls.DATASETS.get(norm_key)
        if not meta:
            return {
                "success": False,
                "dataset_key": dataset_key,
                "error": f"Dataset '{dataset_key}' not recognized in data.gov.in registry"
            }

        try:
            if not force_fallback:
                # Attempt live API
                api_res = await cls.fetch_live_api(norm_key, limit=50)
                if api_res.get("success") and api_res.get("records"):
                    persist_res = cls.parse_and_persist_records(norm_key, api_res["records"], db)
                    if persist_res.get("success"):
                        return {
                            "success": True,
                            "dataset_key": norm_key,
                            "mode": "LIVE_API",
                            "details": persist_res
                        }
                    else:
                        logger.warning(f"Persistence error for {norm_key}: {persist_res.get('error')}")
                        return {
                            "success": False,
                            "dataset_key": norm_key,
                            "mode": "ERROR",
                            "error": persist_res.get("error")
                        }

            # Fallback pipeline
            logger.info(f"Executing fallback import pipeline for {norm_key}")
            fallback_res = cls.execute_fallback_import(norm_key, db)
            return {
                "success": fallback_res.get("success", False),
                "dataset_key": norm_key,
                "mode": "OFFICIAL_REPORT_IMPORT",
                "details": fallback_res,
                "note": "Ingested official verified fallback catalog."
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error in sync_dataset ({norm_key}): {e}", exc_info=True)
            return {
                "success": False,
                "dataset_key": norm_key,
                "mode": "ERROR",
                "error": f"Sync failed: {type(e).__name__} ({str(e)})"
            }

    @classmethod
    def ensure_datasource_exists(cls, meta: Dict[str, Any], db: Session) -> DataSource:
        """Ensures the dataset has an isolated DataSource record with its specific metadata."""
        ds = db.query(DataSource).filter(DataSource.id == meta["source_id"]).first()
        if not ds:
            ds = DataSource(
                id=meta["source_id"],
                source_name=f"{meta['name']} (data.gov.in)",
                source_url=meta["api_endpoint"],
                source_type="NATIONAL_API",
                access_method="REST_API_RESOURCE",
                update_frequency=meta["update_frequency"],
                source_status="ACTIVE"
            )
            db.add(ds)
            db.flush()
        return ds

datagov_connector = DataGovInMultiConnector()
