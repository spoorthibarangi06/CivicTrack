import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, AlertTriangle, ShieldCheck, Camera, Upload, 
  CheckCircle2, ArrowRight, RefreshCw, Eye, Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import OriginBadge from '../components/common/OriginBadge';
import { formatINR, formatPercent, formatDate } from '../utils/formatters';

export default function AIInsightsPage() {
  const [anomalies, setAnomalies] = useState([]);
  const [delayProjects, setDelayProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vision studio state (Module 7C)
  const [photo1, setPhoto1] = useState(null);
  const [photo2, setPhoto2] = useState(null);
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);
  const [visionResult, setVisionResult] = useState(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getAnomalies(),
      api.getProjects({ limit: 10, sort_by: 'budget_desc' })
    ])
      .then(([anomRes, projRes]) => {
        setAnomalies(anomRes);
        setDelayProjects(projRes.projects.filter((p) => p.delay_risk_level === 'HIGH' || p.delay_risk_level === 'MEDIUM'));
      })
      .catch((err) => console.error("Error loading AI insights", err))
      .finally(() => setLoading(false));
  }, []);

  const handleImage1Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto1(file);
      setPreview1(URL.createObjectURL(file));
    }
  };

  const handleImage2Change = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto2(file);
      setPreview2(URL.createObjectURL(file));
    }
  };

  const runVisionAnalysis = async () => {
    if (!photo1) {
      setVisionError("Please select at least one construction photograph to analyze.");
      return;
    }
    setVisionLoading(true);
    setVisionError(null);
    try {
      const formData = new FormData();
      formData.append("image1", photo1);
      if (photo2) {
        formData.append("image2", photo2);
      }
      const res = await api.analyzeImages(formData);
      setVisionResult(res);
    } catch (err) {
      setVisionError(err.message);
    } finally {
      setVisionLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase text-rose-600 tracking-wider">Module 7</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">AI Intelligence & Risk Engine</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Machine learning delay models, Isolation Forest financial anomaly detection, and OpenCV progress photo differential studio.
          </p>
        </div>
      </div>

      {/* AI Governance Policy Notice */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-sm border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Civic Transparency & Explainability Mandate</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All AI indicators are explainable and mathematically grounded. A financial anomaly or delay alert is <strong>not proof of corruption or wrongdoing</strong>; it represents an unusual pattern flagged for human administrative inspection.
          </p>
        </div>
      </div>

      {/* Section A & B: Delay Risk & Financial Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Delay Risk Predictions (Module 7A) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Project Delay Risk Predictions (ML + Heuristics)
              </h2>
              <p className="text-xs text-slate-500">Random Forest Classifier evaluating timeline slippage vs progress</p>
            </div>
            <span className="text-xs font-mono text-slate-400">CivicAI-v1.2</span>
          </div>

          <div className="space-y-3">
            {delayProjects.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/projects/${p.id}`} className="font-bold text-xs text-slate-900 hover:text-blue-600 line-clamp-1">
                    {p.project_name}
                  </Link>
                  <RiskBadge level={p.delay_risk_level} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{p.district} • {p.department}</span>
                  <span className="font-bold font-mono text-slate-800">{formatINR(p.approved_budget, true)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-600">
                  <span>Physical Progress: <strong>{p.latest_progress !== null ? formatPercent(p.latest_progress) : "N/A"}</strong></span>
                  <Link to={`/projects/${p.id}`} className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5">
                    Inspect Factors <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Anomaly Detection (Module 7B) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Financial Anomaly Flags (Isolation Forest)
              </h2>
              <p className="text-xs text-slate-500">Identifies high spend alongside low progress or budget exceedance</p>
            </div>
            <span className="text-xs font-mono text-slate-400">IsoForest-v1.1</span>
          </div>

          <div className="space-y-3">
            {anomalies.map((a) => (
              <div key={a.project_id} className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/90 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/projects/${a.project_id}`} className="font-bold text-xs text-slate-900 hover:text-rose-600 line-clamp-1">
                    {a.project_name}
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <OriginBadge origin={a.data_origin} />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      REQUIRES REVIEW
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Source: <strong>{a.source_portal}</strong></span>
                  <span>Reporting Date: <strong>{a.reporting_date ? formatDate(a.reporting_date) : "Recent Snapshot"}</strong></span>
                </div>

                <p className="text-xs text-rose-950 leading-relaxed font-sans">
                  {a.reason}
                </p>

                <div className="text-[10px] text-slate-500 bg-white/70 p-2 rounded border border-rose-100">
                  <strong>Notice:</strong> {a.limitations_note || "Statistical screening indicator. Conduct independent physical verification."}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-rose-200 text-rose-900">
                  <span>Budget: {formatINR(a.approved_budget, true)}</span>
                  <span>Reported Spend: <strong>{formatINR(a.reported_expenditure, true)}</strong></span>
                  <Link to={`/projects/${a.project_id}`} className="font-bold underline text-rose-700 hover:text-rose-900">
                    Review Dossier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section C: Construction Progress Image Analysis Studio (Module 7C) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
              <Camera className="w-3.5 h-3.5" /> Module 7C
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Construction Progress Computer Vision Studio</h2>
            <p className="text-xs text-slate-500">
              OpenCV edge density estimation and pairwise image difference analysis for civil works monitoring.
            </p>
          </div>
        </div>

        {/* Upload Studio Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Photo 1 (Baseline) */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <span className="text-xs font-bold text-slate-700 block uppercase">1. Baseline Progress Photograph</span>
            {preview1 ? (
              <div className="relative rounded-xl overflow-hidden h-48 bg-slate-900">
                <img src={preview1} alt="Baseline Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setPhoto1(null); setPreview1(null); }}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white rounded text-[10px]"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center h-48 rounded-xl border border-slate-200 bg-white hover:border-amber-400 p-4 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Select Baseline Image</span>
                <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, JPEG up to 10MB</span>
                <input type="file" accept="image/*" onChange={handleImage1Change} className="hidden" />
              </label>
            )}
          </div>

          {/* Photo 2 (Latest - Optional for Comparison) */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <span className="text-xs font-bold text-slate-700 block uppercase">2. Latest Inspection Photograph (Optional Pair)</span>
            {preview2 ? (
              <div className="relative rounded-xl overflow-hidden h-48 bg-slate-900">
                <img src={preview2} alt="Latest Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setPhoto2(null); setPreview2(null); }}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white rounded text-[10px]"
                >
                  Change
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center h-48 rounded-xl border border-slate-200 bg-white hover:border-amber-400 p-4 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Select Later Inspection Image</span>
                <span className="text-[11px] text-slate-400 mt-1">To compute visual differential heatmap</span>
                <input type="file" accept="image/*" onChange={handleImage2Change} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500">
            {photo1 && photo2 ? (
              <span className="text-emerald-700 font-semibold">Pair selected. Comparative change analysis ready.</span>
            ) : photo1 ? (
              <span>Single image selected. Ready for edge density & construction stage estimation.</span>
            ) : (
              <span>Upload photograph(s) to run OpenCV vision inspection.</span>
            )}
          </div>
          <button
            onClick={runVisionAnalysis}
            disabled={!photo1 || visionLoading}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            {visionLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Processing OpenCV Pixels...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Run Vision Inspection
              </>
            )}
          </button>
        </div>

        {visionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs">
            {visionError}
          </div>
        )}

        {/* Vision Analysis Results Output */}
        {visionResult && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 pt-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                Computer Vision Inspection Report ({visionResult.mode})
              </h3>
              <span className="text-xs font-mono text-slate-500">OpenCV 4.10 Engine</span>
            </div>

            {visionResult.mode === 'COMPARATIVE_PROGRESS_ANALYSIS' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Visible Structural Change</span>
                    <div className="text-3xl font-extrabold text-blue-700 font-mono">
                      {visionResult.comparison.visible_change_percentage}%
                    </div>
                    <p className="font-semibold text-slate-800">
                      {visionResult.comparison.comparative_assessment}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      ORB Feature Alignment Matches: <strong>{visionResult.comparison.feature_alignment_matches}</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">Baseline Stage</span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {visionResult.baseline_assessment?.heuristic_stage_indicator}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-semibold">Latest Stage</span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {visionResult.latest_assessment?.heuristic_stage_indicator}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Differential Heatmap Preview */}
                {visionResult.comparison.heatmap_preview_base64 && (
                  <div className="space-y-1.5 text-center">
                    <span className="text-[11px] font-bold text-slate-600 block">Computed Difference Heatmap Overlay</span>
                    <div className="rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-black">
                      <img
                        src={visionResult.comparison.heatmap_preview_base64}
                        alt="Change Heatmap"
                        className="w-full h-56 object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Warmer colors indicate altered structures or material placement</span>
                  </div>
                )}
              </div>
            ) : (
              /* Single Photo Analysis */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Canny Edge Density</span>
                  <span className="text-2xl font-bold font-mono text-purple-700">
                    {visionResult.analysis.edge_density_percentage}%
                  </span>
                  <p className="text-[11px] text-slate-500">Structural complexity index</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Stage Indicator</span>
                  <span className="text-base font-bold text-slate-900 block">
                    {visionResult.analysis.heuristic_stage_indicator}
                  </span>
                  <p className="text-[11px] text-slate-500">Surface color & texture matching</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Image Dimensions</span>
                  <span className="text-base font-mono font-bold text-slate-800 block">
                    {visionResult.analysis.image_dimensions} px
                  </span>
                  <p className="text-[11px] text-slate-500">Decoded resolution</p>
                </div>
              </div>
            )}

            {/* Mandatory Section 5 Module 7C Disclaimer */}
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              <strong>Mandatory Compliance Notice:</strong> Photographic analysis provides supplemental visual approximations. A photograph does NOT prove contractor authenticity, structural engineering compliance, or legal financial expenditure eligibility. Results must be correlated with certified engineer measurement books (M-Books).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
