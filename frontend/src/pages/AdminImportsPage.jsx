import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  ChevronLeft, ArrowRight, RefreshCw, FileText, Check, X
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminImportsPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setDryRunResult(null);
      setImportResult(null);
      setError(null);
    }
  };

  const handlePreviewDryRun = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dry_run", "true");

      const res = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
        ? await api.importExcel(formData)
        : await api.importCSV(formData);

      if (!res.success) {
        setError(res.error || "Validation failed");
      } else {
        setDryRunResult(res);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dry_run", "false");

      const res = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
        ? await api.importExcel(formData)
        : await api.importCSV(formData);

      if (!res.success) {
        setError(res.error || "Import failed");
      } else {
        setImportResult(res);
        setDryRunResult(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link to="/admin" className="hover:text-slate-900 flex items-center gap-1 font-semibold">
          <ChevronLeft className="w-4 h-4" /> Back to Admin Overview
        </Link>
        <span className="font-mono">CSV/XLSX Ingestion Pipeline</span>
      </div>

      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Module 8</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Official Report Ingestion</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Import publicly downloaded CSV/Excel work registers. Features auto column-mapping, schema verification, and duplicate tracking.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <label className="cursor-pointer font-bold text-sm text-blue-600 hover:text-blue-700 underline">
              Choose Karnataka CSV or Excel Report
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500 mt-1">
              Supports eGramSwaraj exports, KPPP tender CSVs, and PWD road project sheets (max 15MB)
            </p>
          </div>
          {file && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{file.name}</span>
              <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={handlePreviewDryRun}
            disabled={!file || loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            {loading && !dryRunResult ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 text-blue-600" />
            )}
            Preview & Validate (Dry Run)
          </button>

          {dryRunResult && (
            <button
              onClick={handleExecuteImport}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              Confirm & Ingest to Database
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Ingestion Validation Notice</span>
            </div>
            <p>{error}</p>
          </div>
        )}

        {/* Dry Run Preview Output (Section 5 Module 8) */}
        {dryRunResult && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Validation Preview Summary</h3>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                DRY RUN PASSED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Total Rows</span>
                <span className="text-lg font-bold font-mono text-slate-900">{dryRunResult.total_rows}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Valid Records</span>
                <span className="text-lg font-bold font-mono text-emerald-700">{dryRunResult.valid_records}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Duplicates Detected</span>
                <span className="text-lg font-bold font-mono text-amber-700">{dryRunResult.duplicate_count}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[10px] uppercase">Errors</span>
                <span className="text-lg font-bold font-mono text-rose-700">{dryRunResult.error_count}</span>
              </div>
            </div>

            {/* Preview Sample Table */}
            {dryRunResult.preview_sample?.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Project ID</th>
                      <th className="py-2.5 px-3">Project Title</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Duplicate?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dryRunResult.preview_sample.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-mono text-slate-700">{row.id}</td>
                        <td className="py-2 px-3 font-medium text-slate-900 max-w-xs truncate">{row.name}</td>
                        <td className="py-2 px-3 text-slate-600">{row.district}</td>
                        <td className="py-2 px-3">{row.status}</td>
                        <td className="py-2 px-3 font-semibold">
                          {row.is_duplicate ? (
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">Update Existing</span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">New Record</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Live Import Success Banner */}
        {importResult && (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Import Completed Successfully</span>
            </div>
            <p className="text-xs text-emerald-800">
              Ingested <strong>{importResult.records_accepted}</strong> Karnataka project records into the database. Audit trail logged.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/projects"
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                View in Directory
              </Link>
              <button
                onClick={() => { setImportResult(null); setFile(null); }}
                className="px-4 py-2 rounded-lg border border-emerald-300 text-emerald-900 font-semibold text-xs bg-white"
              >
                Upload Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
