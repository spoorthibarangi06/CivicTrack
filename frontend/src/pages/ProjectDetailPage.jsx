import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, MapPin, Calendar, ExternalLink, ShieldCheck, 
  AlertTriangle, CheckCircle2, TrendingUp, Clock, FileText, 
  ChevronLeft, Info, HelpCircle, Home, Bus, Layers
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import RiskBadge from '../components/common/RiskBadge';
import OriginBadge from '../components/common/OriginBadge';
import { formatINR, formatPercent, formatDate } from '../utils/formatters';

function parseHousingMilestones(desc) {
  if (!desc) return null;
  const tMatch = desc.match(/Targets:\s*([0-9,]+)/i);
  const cMatch = desc.match(/Completed[^:]*:\s*([0-9,]+)/i);
  const fMatch = desc.match(/Foundation:\s*([0-9,]+)/i);
  const lMatch = desc.match(/Lintel:\s*([0-9,]+)/i);
  const rMatch = desc.match(/Roof:\s*([0-9,]+)/i);
  const pMatch = desc.match(/(?:Active Construction|Active Works|In Progress):\s*([0-9,]+)/i);
  const uMatch = desc.match(/Unstarted:\s*([0-9,]+)/i);

  if (!tMatch && !cMatch) return null;

  const toInt = (m) => (m ? parseInt(m[1].replace(/,/g, ''), 10) : 0);
  return {
    targets: toInt(tMatch),
    completed: toInt(cMatch),
    foundation: toInt(fMatch),
    lintel: toInt(lMatch),
    roof: toInt(rMatch),
    inProgress: toInt(pMatch),
    unstarted: toInt(uMatch),
  };
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getProjectDetail(id)
      .then((data) => setProject(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Loading project dossier...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Project Record Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The requested project record could not be retrieved from the database.
        </p>
        <Link to="/projects" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold mt-2">
          Back to Directory
        </Link>
      </div>
    );
  }

  const activeDelayRisk = project.predictions?.find((p) => p.prediction_type === "DELAY_RISK");
  const financialAnomaly = project.predictions?.find((p) => p.prediction_type === "FINANCIAL_ANOMALY");
  const latestDesc = project.progress_updates?.[0]?.progress_description;
  const housingMilestones = parseHousingMilestones(latestDesc);

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link to="/projects" className="hover:text-slate-900 flex items-center gap-1 font-semibold">
          <ChevronLeft className="w-4 h-4" /> Back to Projects Directory
        </Link>
        <span className="font-mono text-slate-400">ID: {project.source_record_id}</span>
      </div>

      {/* Header Dossier Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs font-mono font-bold">
              {project.source_record_id}
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 text-xs font-medium">
              {project.category}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <OriginBadge origin={project.data_origin} />
            <StatusBadge status={project.project_status} />
            <RiskBadge level={project.delay_risk_level} />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          {project.project_name}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div>
            <span className="text-[11px] uppercase font-semibold text-slate-400 block">Executing Department</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{project.department}</span>
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold text-slate-400 block">District & Taluk</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {project.district}{project.taluk ? `, Taluk ${project.taluk}` : ''}
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold text-slate-400 block">Official Source Portal</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{project.source_name || "Karnataka Official Portal"}</span>
          </div>
        </div>
      </div>

      {/* Grid: Financial & Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Published Financial Information
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Reporting Date: {formatDate(project.reporting_date || project.updated_at)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Approved Budget</span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-1 block">
                {formatINR(project.approved_budget)}
              </span>
              <span className="text-[10px] text-slate-400">Sanction ceiling</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Reported Spend</span>
              <span className="text-base sm:text-lg font-bold font-mono text-blue-700 mt-1 block">
                {project.latest_expenditure !== null ? formatINR(project.latest_expenditure) : "Not available in source"}
              </span>
              <span className="text-[10px] text-slate-400">Voucher disbursements</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Released Funds</span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-1 block">
                {project.financial_records?.[0]?.released_amount 
                  ? formatINR(project.financial_records[0].released_amount)
                  : (project.latest_released_amount ? formatINR(project.latest_released_amount) : "Not available in source")}
              </span>
              <span className="text-[10px] text-slate-400">Treasury sanction</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Contract / Tender</span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-1 block">
                {project.financial_records?.[0]?.awarded_contract_value 
                  ? formatINR(project.financial_records[0].awarded_contract_value)
                  : (project.financial_records?.[0]?.tender_value ? formatINR(project.financial_records[0].tender_value) : "Not available in source")}
              </span>
              <span className="text-[10px] text-slate-400">Awarded agreement</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-amber-50/70 p-3 rounded-lg border border-amber-200/80 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Accounting Rule:</strong> Approved budget, released funds, awarded contract values, and actual expenditures are distinct categories governed by state financial rules and are not treated as interchangeable figures.
            </span>
          </div>
        </div>

        {/* Physical Progress & Milestone Gauge (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Reported Physical Progress
          </h2>

          <div className="space-y-3 pt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500 font-medium">Completion Index</span>
              <span className="text-3xl font-extrabold text-blue-700 font-mono">
                {project.latest_progress !== null ? formatPercent(project.latest_progress) : "Not available in source"}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, project.latest_progress || 0)}%` }}
              ></div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Commenced:</span>
                <span className="font-semibold text-slate-900">{formatDate(project.start_date)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Target Completion:</span>
                <span className="font-semibold text-slate-900">{formatDate(project.expected_end_date)}</span>
              </div>
              {project.actual_end_date && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Actual Completion:</span>
                  <span className="font-bold">{formatDate(project.actual_end_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated District Housing Milestone Dossier (for Basava Housing & PMAY-G) */}
      {housingMilestones && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 mb-1">
                <Home className="w-3.5 h-3.5" /> State Affordable Housing Scheme Milestone Registry
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">District Housing Allocations & Physical Construction Stages</h2>
              <p className="text-xs text-slate-500">
                Official unit allocations and ground verification stages for {project.district} from National Open Government Data (data.gov.in).
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono">
              Overall Completion: {formatPercent(project.latest_progress)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Sanctioned Targets</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 mt-1 block">
                {housingMilestones.targets.toLocaleString('en-IN')} units
              </span>
              <span className="text-[10px] text-slate-400">Total approved beneficiaries</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase block">Completed Pucca Houses</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-800 mt-1 block">
                {housingMilestones.completed.toLocaleString('en-IN')} units
              </span>
              <span className="text-[10px] text-emerald-600">Geo-tagged completed</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-semibold text-blue-700 uppercase block">Active Construction</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-blue-800 mt-1 block">
                {housingMilestones.inProgress.toLocaleString('en-IN')} units
              </span>
              <span className="text-[10px] text-blue-600">Foundation, lintel & roof</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Unstarted Units</span>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-700 mt-1 block">
                {housingMilestones.unstarted.toLocaleString('en-IN')} units
              </span>
              <span className="text-[10px] text-slate-400">Awaiting site commencement</span>
            </div>
          </div>

          {/* Detailed Milestone Stages Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Physical Construction Stage Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-600 block">Foundation Stage</span>
                  <span className="text-[11px] text-slate-400">Plinth & excavation level</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">{housingMilestones.foundation.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-600 block">Lintel Stage</span>
                  <span className="text-[11px] text-slate-400">Wall masonry completed</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">{housingMilestones.lintel.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-600 block">Roof Stage</span>
                  <span className="text-[11px] text-slate-400">Slab cast / final finishing</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">{housingMilestones.roof.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Year Financial Statements Table (for BMTC & Multi-Year Portals) */}
      {project.financial_records && project.financial_records.length > 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200 mb-1">
                <Bus className="w-3.5 h-3.5" /> Public Transit Multi-Year Statement
              </div>
              <h2 className="text-xl font-bold text-slate-900">Historical & Active Fiscal Year Records</h2>
              <p className="text-xs text-slate-500">
                Discrete financial records published per financial year from official audit vouchers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Financial Year</th>
                  <th className="py-2.5 px-4">Published Amount</th>
                  <th className="py-2.5 px-4">Expenditure Disbursed</th>
                  <th className="py-2.5 px-4">Reporting Date</th>
                  <th className="py-2.5 px-4">Official Source Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.financial_records.map((fin) => (
                  <tr key={fin.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{fin.financial_year}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                      {fin.approved_amount ? formatINR(fin.approved_amount) : "Not available in source"}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-blue-700">
                      {fin.expenditure_amount ? formatINR(fin.expenditure_amount) : "Not available in source"}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono">{formatDate(fin.reporting_date)}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                      {fin.source_record_id || project.source_record_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Intelligence & Risk Assessment Dossier Section (Section 5 Module 7) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase text-rose-600 tracking-wider">AI Evaluation Engine</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">Automated Risk & Anomaly Assessment</h2>
          </div>
          {activeDelayRisk && (
            <div className="flex items-center gap-2">
              <RiskBadge level={activeDelayRisk.risk_level} score={activeDelayRisk.risk_score} />
              <span className="text-xs font-mono text-slate-400">Model: {activeDelayRisk.model_version}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delay Risk Factors */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Delay Risk Decision Factors</h3>
            {activeDelayRisk?.explanation ? (
              <ul className="space-y-2">
                {activeDelayRisk.explanation.split(';').map((factor, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span>{factor.trim()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No active delay risk factors identified.</p>
            )}
          </div>

          {/* Financial Anomaly Detection Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Spending Velocity & Anomaly Check</h3>
            {financialAnomaly ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Pattern Requires Human Administrative Review</span>
                </div>
                <p className="text-xs text-rose-950 leading-relaxed">
                  {financialAnomaly.explanation}
                </p>
                <div className="pt-2 text-[11px] text-rose-700 flex items-center justify-between border-t border-rose-200">
                  <span>Assessed: {formatDate(financialAnomaly.prediction_date)}</span>
                  <span className="font-semibold">Review Status: PENDING</span>
                </div>
              </div>
            ) : (project.approved_budget === null && project.latest_expenditure === null) ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Physical milestone tracking scheme. Absence of budgetary figures in the source unit registry is standard and is not classified as an anomaly or data corruption.</span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Expenditure trajectory tracks reported physical progress within normal statistical variance.</span>
              </div>
            )}

            {/* Model Disclaimer Note */}
            <div className="p-3 rounded-lg bg-slate-50 text-[11px] text-slate-500 border border-slate-200">
              <strong>Data Limitation Note:</strong> Predictions rely on officially published department milestones. Local ground disputes, right-of-way litigation, or force majeure events not documented in portal v2 records may alter delivery timelines.
            </div>
          </div>
        </div>
      </div>

      {/* Historical Milestones & Source Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Historical Progress Milestones</h2>
          <div className="space-y-3">
            {project.progress_updates?.map((prog, idx) => (
              <div key={prog.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-mono text-[11px]">{formatDate(prog.reporting_date)}</span>
                  <span className="font-bold font-mono text-blue-700">{formatPercent(prog.progress_percentage)}</span>
                </div>
                <p className="text-slate-700">{prog.progress_description || "Progress milestone submitted."}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Source Citation & Ground Truth */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Source Evidence & Audit Linkage</h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Data Origin Classification</span>
              <OriginBadge origin={project.data_origin} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Original Government Portal URL</span>
              {project.source_url ? (
                <a
                  href={project.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-blue-600 hover:text-blue-800 break-all flex items-center gap-1.5 font-medium"
                >
                  {project.source_url}
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              ) : (
                <span className="text-slate-500">Official export CSV archive</span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Spatial Precision Verification</span>
              <p className="text-slate-700">
                {project.data_quality_notes}
              </p>
              {project.latitude && project.longitude && (
                <div className="pt-1 font-mono text-[11px] text-slate-500">
                  GPS: {project.latitude.toFixed(4)}° N, {project.longitude.toFixed(4)}° E
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-slate-500">Data Retrieval & Verification Timestamp:</span>
              <span className="font-mono text-slate-700">
                {project.retrieval_timestamp ? formatDate(project.retrieval_timestamp) : formatDate(project.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
