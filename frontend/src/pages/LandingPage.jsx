import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ArrowRight, ShieldCheck, TrendingUp, AlertTriangle, 
  MapPin, CheckCircle2, Database, Sparkles, Building2, Eye, FileText
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOverviewKPIs()
      .then((data) => setKpis(data))
      .catch((err) => console.error("Failed to load KPIs", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/projects');
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 md:p-14 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-amber-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Karnataka Government Project Transparency & Accountability
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Monitor Public Works Across <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Karnataka</span> With AI Intelligence
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            CivicTrack Karnataka empowers citizens, journalists, and administrators to track sanctioned budgets, verified expenditures, reported physical progress, and AI-predicted delivery risks across all 31 districts.
          </p>

          {/* Quick Search */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects by name, taluk, department (e.g. Koramangala SWD, PWD, Gokak)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              Search Works
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4 text-xs font-semibold">
            <Link
              to="/projects"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
            >
              Browse 149 Tracked Projects
            </Link>
            <Link
              to="/map"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 transition-colors border border-amber-400/30 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              Open Interactive Map
            </Link>
            <Link
              to="/ai-insights"
              className="px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors border border-rose-500/40 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Risk Indicators
            </Link>
          </div>
        </div>
      </section>

      {/* Main KPI Stats Bar */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Tracked Projects</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : (kpis?.total_projects_tracked || 0)}
            </span>
            <p className="text-xs text-slate-500 mt-1">Across Karnataka districts</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Approved Budget</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : formatINR(kpis?.total_approved_budget, true)}
            </span>
            <p className="text-xs text-slate-500 mt-1">Sanctioned public allocations</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Reported Expenditure</span>
            <Eye className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? "..." : formatINR(kpis?.total_reported_expenditure, true)}
            </span>
            <p className="text-xs text-slate-500 mt-1">Published voucher disbursements</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>AI Risk & Review Flags</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">
                {loading ? "..." : (kpis?.delay_risk_projects_count || 0)}
              </span>
              <span className="text-xs font-semibold text-slate-500">delay risks</span>
              <span className="text-base font-bold text-amber-600">
                / {loading ? "..." : (kpis?.financial_review_projects_count || 0)}
              </span>
              <span className="text-xs font-semibold text-slate-500">review</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Flagged for human verification</p>
          </div>
        </div>
      </section>

      {/* How the Platform Works */}
      <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-8">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Public Accountability Pipeline</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">How CivicTrack Karnataka Operates</h2>
          <p className="text-slate-600 text-sm mt-2 max-w-2xl">
            A reliable civic architecture turning fragmented government portals into searchable, transparent, and verified intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-base">Public Data Ingestion</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extracts public reports from eGramSwaraj, Karnataka Public Procurement Portal (KPPP), Open Data Karnataka, and PFMS.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-base">Data Standardization</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Distinguishes Approved Budget, Released Funds, and Actual Expenditure. Missing attributes are never forced to zero.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-base">AI Delay & Anomaly Engines</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detects timeline slippages and expenditure-progress divergence using transparent rules and Scikit-learn Random Forest models.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-base">Citizen Engagement</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provides interactive GIS mapping, project-level financial history, official source citations, and admin review workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Official Government Data Sources Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Ground Truth Sources</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Official Karnataka Government Data Portals</h2>
            <p className="text-sm text-slate-600 mt-1">
              Every figure displayed is anchored to officially published government reports.
            </p>
          </div>
          <Link to="/sources" className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1">
            View Source Registry & Verification <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Rural & Panchayat Works
              </span>
              <h3 className="font-bold text-slate-900 text-base">eGramSwaraj Karnataka</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Panchayat development plans, Gram Panchayat physical progress, 15th Finance Commission rural drinking water and road vouchers.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 text-xs font-mono text-slate-500">
              https://egramswaraj.gov.in/
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Procurement & Tenders
              </span>
              <h3 className="font-bold text-slate-900 text-base">Karnataka Procurement (KPPP)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Official tender bulletins, contracted vendor values, executing state departments, and milestone sanction notifications.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 text-xs font-mono text-slate-500">
              https://kppp.karnataka.gov.in/
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Public Works & Irrigation
              </span>
              <h3 className="font-bold text-slate-900 text-base">Karnataka Open Data Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                State departmental registers from PWD, Health, Irrigation, and Urban Infrastructure containing project milestone dates.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 text-xs font-mono text-slate-500">
              https://karnataka.data.gov.in/
            </div>
          </div>
        </div>
      </section>

      {/* Transparency & AI Ethics Notice Banner */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            Civic Methodology & AI Ethics Standard
          </div>
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
            CivicTrack Karnataka follows strict non-accusatory civic governance principles. Flagged anomalies highlight mathematical or scheduling divergences for human administrative inspection and do not constitute allegations of corruption or wrongdoing.
          </p>
        </div>
        <Link
          to="/sources"
          className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors"
        >
          Read Methodology Guide
        </Link>
      </section>
    </div>
  );
}
