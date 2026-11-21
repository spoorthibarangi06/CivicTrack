import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Upload, RefreshCw, CheckCircle2, AlertTriangle, 
  FileText, History, ExternalLink, UserCheck, Check, X, Database, Eye
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';

export default function AdminPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [logs, setLogs] = useState({ import_logs: [], audit_logs: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Review modal / active review state
  const [reviewingProject, setReviewingProject] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('RESOLVED');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // data.gov.in Multi-Resource State
  const [datagovCatalog, setDatagovCatalog] = useState([]);
  const [datagovLoadingKey, setDatagovLoadingKey] = useState(null);
  const [datagovResult, setDatagovResult] = useState(null);

  useEffect(() => {
    const user = api.getCurrentUser();
    if (!user) {
      navigate('/login?redirect=/admin');
      return;
    }
    setCurrentUser(user);

    Promise.all([
      api.getAnomalies(),
      api.getAdminLogs().catch(() => ({ import_logs: [], audit_logs: [] })),
      api.getDatagovCatalog().catch(() => ({ datasets: [] }))
    ])
      .then(([anomData, logData, catData]) => {
        setAnomalies(anomData);
        setLogs(logData);
        setDatagovCatalog(catData.datasets || []);
      })
      .catch((err) => console.error("Error loading admin data", err))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.triggerSync();
      setSyncResult(res);
      // Refresh logs
      const updatedLogs = await api.getAdminLogs();
      setLogs(updatedLogs);
    } catch (err) {
      alert("Sync error: " + err.message);
      if (err.message.includes('expired') || err.message.includes('Authentication') || err.message.includes('credentials')) {
        navigate('/login?redirect=/admin');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveAnomaly = async (e) => {
    e.preventDefault();
    if (!reviewingProject || !reviewerNotes.trim()) {
      alert("Please enter reviewer rationale / audit notes.");
      return;
    }

    try {
      await api.reviewProject(reviewingProject.project_id, reviewDecision, reviewerNotes.trim());
      setReviewSuccess(`Project anomaly updated with status ${reviewDecision}`);
      setReviewingProject(null);
      setReviewerNotes('');
      // Refresh anomalies
      const updatedAnomalies = await api.getAnomalies();
      setAnomalies(updatedAnomalies);
      // Refresh logs
      const updatedLogs = await api.getAdminLogs();
      setLogs(updatedLogs);
    } catch (err) {
      alert("Failed to save review decision: " + err.message);
    }
  };

  const handleFetchDatagov = async (datasetKey, dryRun = false) => {
    setDatagovLoadingKey(datasetKey + (dryRun ? '_dry' : '_fetch'));
    setDatagovResult(null);
    try {
      const res = await api.fetchDatagovDataset(datasetKey, { dry_run: dryRun });
      setDatagovResult(res);
      const updatedCat = await api.getDatagovCatalog();
      setDatagovCatalog(updatedCat.datasets || []);
      const updatedLogs = await api.getAdminLogs();
      setLogs(updatedLogs);
    } catch (err) {
      alert(`Error fetching ${datasetKey}: ${err.message}`);
      if (err.message.includes('expired') || err.message.includes('Authentication') || err.message.includes('credentials')) {
        navigate('/login?redirect=/admin');
      }
    } finally {
      setDatagovLoadingKey(null);
    }
  };

  const handleFetchAllDatagov = async () => {
    setDatagovLoadingKey('all');
    setDatagovResult(null);
    try {
      const res = await api.fetchAllDatagovDatasets();
      setDatagovResult(res);
      const updatedCat = await api.getDatagovCatalog();
      setDatagovCatalog(updatedCat.datasets || []);
      const updatedLogs = await api.getAdminLogs();
      setLogs(updatedLogs);
    } catch (err) {
      alert(`Batch sync error: ${err.message}`);
      if (err.message.includes('expired') || err.message.includes('Authentication') || err.message.includes('credentials')) {
        navigate('/login?redirect=/admin');
      }
    } finally {
      setDatagovLoadingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Checking administrative permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase text-rose-600 tracking-wider">Module 8</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin & Governance Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authenticated control center for data synchronization, CSV batch ingestion, and anomaly review workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/imports"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            Upload CSV / Excel
          </Link>
          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Trigger Source Sync
          </button>
          <button
            onClick={() => {
              api.logout();
              navigate('/login?redirect=/admin');
            }}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Sign out or refresh session"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentUser?.username || 'admin'}</span>
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Synchronization Probe Completed Successfully</span>
          </div>
          <p>Verified {syncResult.sources_checked} registered public government portals.</p>
        </div>
      )}

      {reviewSuccess && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
          <span>{reviewSuccess}</span>
          <button onClick={() => setReviewSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Flagged Anomaly Review Workflow (Section 5 Module 8) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Administrative Anomaly Review & Adjudication
            </h2>
            <p className="text-xs text-slate-500">
              Inspect AI flagged spending divergence, enter verified audit findings, and update public status.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200">
            {anomalies.length} Pending Adjudication
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No unresolved anomalies currently pending administrative review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Project & Department</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Approved Budget</th>
                  <th className="py-3 px-4">Reported Spend</th>
                  <th className="py-3 px-4">Flag Description</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anomalies.map((a) => (
                  <tr key={a.project_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                      <div className="line-clamp-1">{a.project_name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{a.department}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{a.district}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatINR(a.approved_budget, true)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                      {formatINR(a.reported_expenditure, true)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-sm">
                      <p className="line-clamp-2 text-[11px] leading-relaxed">{a.reason}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setReviewingProject(a);
                          setReviewerNotes('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal / Drawer */}
      {reviewingProject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Adjudicate Anomaly Flag</h3>
              <button onClick={() => setReviewingProject(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Target Project</span>
              <p className="font-bold text-slate-900 text-sm">{reviewingProject.project_name}</p>
              <p className="text-slate-600">{reviewingProject.reason}</p>
            </div>

            <form onSubmit={handleResolveAnomaly} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Administrative Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="RESOLVED">Resolve Flag (Verified Supplementary Sanction / Advance)</option>
                  <option value="VERIFIED_ANOMALY">Substantiate (Refer to Chief Engineer / Audit Division)</option>
                  <option value="DISMISSED">Dismiss (Data Entry Variance in Source Portal)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Auditor / Reviewer Rationale Notes</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter administrative review explanation, verification reference order number, or ground inspection remarks..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingProject(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
                >
                  Save Review Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* data.gov.in Multi-Dataset Manager */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mb-1">
              <Database className="w-3.5 h-3.5" /> OGD India Multi-Resource Connector
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              National Open Government Data (data.gov.in) Datasets
            </h2>
            <p className="text-xs text-slate-500">
              Isolated API pipelines for Karnataka Housing and BMTC Transit schemes using the secure backend <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">DATA_GOV_IN_API_KEY</code>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchAllDatagov}
              disabled={datagovLoadingKey !== null}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${datagovLoadingKey === 'all' ? 'animate-spin' : ''}`} />
              Fetch All Resources
            </button>
          </div>
        </div>

        {/* Action result banner if present */}
        {datagovResult && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                data.gov.in Action Response ({datagovResult.mode || (datagovResult.datasets_synced ? 'Batch Sync' : 'Completed')})
              </span>
              <button onClick={() => setDatagovResult(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <pre className="text-[11px] font-mono bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto text-slate-700 max-h-48">
              {JSON.stringify(datagovResult, null, 2)}
            </pre>
          </div>
        )}

        {/* 4 Datasets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {datagovCatalog.map((ds) => (
            <div
              key={ds.dataset_key}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold truncate max-w-[200px]" title={ds.resource_id}>
                    {ds.resource_id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                    {ds.sector}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {ds.name}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {ds.description}
                </p>

                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Department</span>
                    <span className="font-medium text-slate-800 truncate block">{ds.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Category</span>
                    <span className="font-medium text-slate-800 truncate block">{ds.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Database Records</span>
                    <span className="font-mono font-bold text-slate-900">{ds.records_in_db} records</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Origin Status</span>
                    <span className="font-mono text-emerald-700 font-semibold">{ds.live_api_records} live API</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleFetchDatagov(ds.dataset_key, true)}
                  disabled={datagovLoadingKey !== null}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Query API and preview returned fields without writing to database"
                >
                  <Eye className="w-3 h-3 text-blue-600" />
                  {datagovLoadingKey === ds.dataset_key + '_dry' ? 'Inspecting...' : 'Preview (Dry Run)'}
                </button>
                <button
                  onClick={() => handleFetchDatagov(ds.dataset_key, false)}
                  disabled={datagovLoadingKey !== null}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50"
                  title="Fetch authentic records and persist to database"
                >
                  <RefreshCw className={`w-3 h-3 ${datagovLoadingKey === ds.dataset_key + '_fetch' ? 'animate-spin' : ''}`} />
                  {datagovLoadingKey === ds.dataset_key + '_fetch' ? 'Fetching...' : 'Fetch & Ingest'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Audit & Import Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Logs */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            File Ingestion History
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {logs.import_logs?.length === 0 ? (
              <p className="text-slate-400 py-4">No CSV/Excel imports logged yet.</p>
            ) : (
              logs.import_logs?.slice(0, 5).map((i) => (
                <div key={i.id} className="py-3 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">{i.file_name}</span>
                    <p className="text-[11px] text-slate-500">{i.error_summary}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-emerald-700 font-bold">+{i.records_accepted} rec</span>
                    <span className="text-[10px] text-slate-400 block">{formatDate(i.imported_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            Administrative Audit Trail
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {logs.audit_logs?.length === 0 ? (
              <p className="text-slate-400 py-4">No audit actions recorded.</p>
            ) : (
              logs.audit_logs?.slice(0, 5).map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{a.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">by {a.user_id}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{a.change_summary}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {formatDate(a.action_timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
