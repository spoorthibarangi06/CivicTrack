# Official Karnataka Government Data Sources

CivicTrack Karnataka aggregates public data from official portals strictly adhering to publicly available records.

## 1. Primary Sources

| Source Name | Portal URL | Entity Scope | Ingestion Method | Typical Frequency |
|---|---|---|---|---|
| **eGramSwaraj** | `https://egramswaraj.gov.in/` | Panchayat development, GPDP, 15th FC plans, rural works | CSV/Excel batch & Public Report Export | Quarterly / Annual |
| **Karnataka Public Procurement Portal (KPPP)** | `https://kppp.karnataka.gov.in/` | Works tenders, contract values, awarded vendors | Public Tender Bulletin Export / CSV Import | Monthly |
| **Karnataka Open Data Portal (KODP)** | `https://karnataka.data.gov.in/` | PWD road works, RDPR projects, irrigation, health centers | Dataset Catalog Download & CSV API | Bi-annual |
| **National Open Government Data (data.gov.in)** | `https://www.data.gov.in/` | Central + State matching schemes (PMGSY, AMRUT, Smart Cities) | Data.gov.in Resource API & CSV | Monthly |
| **Public PFMS Reports** | `https://pfms.nic.in/` | Public fund releases by scheme / department | Downloaded financial sanction summaries | Quarterly |

---

## 2. Distinction of Financial Categories

Per Section 6 and Section 13 of the Master Specification:
- **Approved Budget**: The ceiling allocated by the administrative sanction order.
- **Funds Released**: Treasury release to the implementing agency or bank account (NOT expenditure).
- **Reported Expenditure**: Actual voucher disbursement documented in public audit/accounts.
- **Contract Awarded Value**: The tender contract agreement amount with the vendor.

*Rule: Under no circumstances are approved budget, released funds, and actual expenditure treated as interchangeable or aggregated together across incompatible financial years.*

---

## 3. Fallback Acquisition Workflow

When public government APIs are intermittently unavailable, firewalled, or require manual session tokens:
1. Administrators utilize the **Admin CSV/Excel Ingestion Interface**.
2. Files downloaded directly from the official portal are uploaded.
3. The platform validates headers, maps columns, audits duplicate `source_record_id`s, and logs the verification audit trail.
