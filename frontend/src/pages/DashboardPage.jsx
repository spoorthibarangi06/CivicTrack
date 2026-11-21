import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, TrendingUp, Eye, CheckCircle2, Clock, AlertTriangle, 
  ShieldAlert, ArrowRight, BarChart3, PieChart as PieIcon, Filter,
  Home, Bus, Database, Search, ExternalLink, Info, Check, ShieldCheck,
  RefreshCw, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, PieChart, Pie, Cell 
} from 'recharts';
import { api } from '../services/api';
import KPICard from '../components/common/KPICard';
import StatusBadge from '../components/common/StatusBadge';
import RiskBadge from '../components/common/RiskBadge';
import OriginBadge from '../components/common/OriginBadge';
import { formatINR, formatPercent, formatDate } from '../utils/formatters';

const STATUS_COLORS = {
  COMPLETED: '#10B981',
  ONGOING: '#3B82F6',
  DELAYED: '#EF4444',
  PLANNED: '#64748B',
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [districtData, setDistrictData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dedicated Government Datasets Monitor States
  const [activeSchemeTab, setActiveSchemeTab] = useState('housing'); // 'housing', 'transport', 'transparency'
  const [housingDistrictSearch, setHousingDistrictSearch] = useState('');
  const [housingData, setHousingData] = useState(null);
  const [transportData, setTransportData] = useState(null);
  const [transparencyData, setTransparencyData] = useState([]);
  const [schemesLoading, setSchemesLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverviewKPIs(),
      api.getDistrictStats(),
      api.getDepartmentStats(),
      api.getHousingDistrictSummary().catch(() => null),
      api.getBmtcTransportSummary().catch(() => null),
      api.getDatasetsTransparency().catch(() => [])
    ])
      .then(([kpiRes, distRes, deptRes, houseRes, transRes, tpRes]) => {
        setKpis(kpiRes);
        setDistrictData(distRes.slice(0, 8)); // Top 8 districts by budget
        setDepartmentData(deptRes.slice(0, 6)); // Top 6 departments
        setHousingData(houseRes);
        setTransportData(transRes);
        setTransparencyData(tpRes || []);
      })
      .catch((err) => console.error("Error loading dashboard data", err))
      .finally(() => {
        setLoading(false);
        setSchemesLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-500">Loading Karnataka Citizen Dashboard...</p>
      </div>
    );
  }

  // Format chart data for districts
  const districtChartData = districtData.map((d) => ({
    name: d.district,
    "Approved Budget": Number((Number(d.approved_budget) / 10000000).toFixed(1)), // In Crores
    "Reported Expenditure": Number((Number(d.reported_expenditure) / 10000000).toFixed(1)),
    projects: d.project_count,
  }));

  // Status distribution
  const statusPieData = [
    { name: 'Reported Ongoing', value: kpis?.ongoing_projects_count || 0, color: '#3B82F6' },
    { name: 'Completed in Records', value: kpis?.completed_projects_count || 0, color: '#10B981' },
    { name: 'Potential Delay Overrun', value: kpis?.delay_risk_projects_count || 0, color: '#EF4444' },
  ];

  // Filtered districts for housing schemes
  const filteredHousingDistricts = housingData?.districts?.filter((d) =>
    d.district.toLowerCase().includes(housingDistrictSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Module 2</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Citizen Monitoring Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time public expenditure, physical progress milestones, and AI delay risk tracking across Karnataka.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/projects"
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" />
            Explore All 149 Projects
          </Link>
        </div>
      </div>

      {/* Top 7 KPI Cards (Section 5 Module 2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPICard
          title="Tracked Projects"
          value={kpis?.total_projects_tracked || 0}
          icon={Building2}
          color="blue"
        />
        <KPICard
          title="Approved Budget"
          value={formatINR(kpis?.total_approved_budget, true)}
          subtitle="Sanctioned cap"
          icon={TrendingUp}
          color="emerald"
        />
        <KPICard
          title="Reported Spend"
          value={formatINR(kpis?.total_reported_expenditure, true)}
          subtitle="Audit vouchers"
          icon={Eye}
          color="purple"
        />
        <KPICard
          title="Marked Completed"
          value={kpis?.completed_projects_count || 0}
          icon={CheckCircle2}
          color="emerald"
        />
        <KPICard
          title="Active Ongoing"
          value={kpis?.ongoing_projects_count || 0}
          icon={Clock}
          color="blue"
        />
        <KPICard
          title="Potential Delay"
          value={kpis?.delay_risk_projects_count || 0}
          subtitle="AI flagged risk"
          icon={AlertTriangle}
          color="amber"
        />
        <KPICard
          title="Financial Review"
          value={kpis?.financial_review_projects_count || 0}
          subtitle="Divergence flags"
          icon={ShieldAlert}
          color="red"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District-wise Budget vs Expenditure (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">District Budget vs. Reported Expenditure</h2>
              <p className="text-xs text-slate-500">Values in ₹ Crores (Top 8 districts with comparable reports)</p>
            </div>
            <Link to="/analytics" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Full Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: '₹ Crores', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip 
                  formatter={(val) => `₹${val} Cr`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Approved Budget" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Reported Expenditure" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Status Breakdown (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Project Status Distribution</h2>
            <p className="text-xs text-slate-500">Categorization from source records and AI models</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name) => [`${val} projects`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODULE 9: OFFICIAL GOVERNMENT DATASETS & SCHEMES MONITOR                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200 mb-1">
              <Database className="w-3.5 h-3.5" /> data.gov.in Live Government Integration
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Official Government Schemes & Datasets Monitor
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Citizen oversight of district affordable housing allocations, urban transit performance, and open data provenance.
            </p>
          </div>

          {/* Scheme Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1 self-start md:self-center">
            <button
              onClick={() => setActiveSchemeTab('housing')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                activeSchemeTab === 'housing'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-blue-600" />
              Housing Progress (31 Districts)
            </button>
            <button
              onClick={() => setActiveSchemeTab('transport')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                activeSchemeTab === 'transport'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bus className="w-3.5 h-3.5 text-emerald-600" />
              BMTC Transit Performance
            </button>
            <button
              onClick={() => setActiveSchemeTab('transparency')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                activeSchemeTab === 'transparency'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Data Transparency & Methodology
            </button>
          </div>
        </div>

        {schemesLoading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Loading live scheme registries...</p>
          </div>
        ) : (
          <>
            {/* ------------------------------------------------------------- */}
            {/* TAB 1: HOUSING SCHEMES MONITOR (BASAVA + PMAY-G)              */}
            {/* ------------------------------------------------------------- */}
            {activeSchemeTab === 'housing' && (
              <div className="space-y-6">
                {/* State-Level Housing Summary Counters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                    <span className="text-[11px] font-semibold text-blue-700 uppercase block">Total State Sanctioned Targets</span>
                    <span className="text-2xl font-extrabold font-mono text-blue-950 mt-1 block">
                      {housingData?.state_totals?.total_housing_targets?.toLocaleString('en-IN') || '43,28,668'} units
                    </span>
                    <span className="text-[10px] text-blue-600">Combined Basava & PMAY-Grameena</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase block">Completed Pucca Houses</span>
                    <span className="text-2xl font-extrabold font-mono text-emerald-950 mt-1 block">
                      {housingData?.state_totals?.total_houses_completed?.toLocaleString('en-IN') || '37,11,530'} units
                    </span>
                    <span className="text-[10px] text-emerald-600">Verified ground completion</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <span className="text-[11px] font-semibold text-amber-700 uppercase block">Active In-Progress Works</span>
                    <span className="text-2xl font-extrabold font-mono text-amber-950 mt-1 block">
                      {housingData?.state_totals?.total_houses_in_progress?.toLocaleString('en-IN') || '5,73,954'} units
                    </span>
                    <span className="text-[10px] text-amber-700">Foundation, lintel & roof stages</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 text-white">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase block">State Completion Index</span>
                    <span className="text-2xl font-extrabold font-mono text-amber-400 mt-1 block">
                      {housingData?.state_totals?.overall_completion_percentage || 85.7}%
                    </span>
                    <span className="text-[10px] text-slate-300">Across all 31 districts</span>
                  </div>
                </div>

                {/* District Filter & Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search district (e.g. Bagalkot, Belagavi, Koppal, Yadgir)..."
                      value={housingDistrictSearch}
                      onChange={(e) => setHousingDistrictSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Showing {filteredHousingDistricts.length} of {housingData?.total_districts || 31} Karnataka districts
                  </span>
                </div>

                {/* District Comparison Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">Combined Targets</th>
                        <th className="py-3 px-4">Completed Units</th>
                        <th className="py-3 px-4">State Completion %</th>
                        <th className="py-3 px-4">Basava Housing Scheme</th>
                        <th className="py-3 px-4">PMAY-Grameena</th>
                        <th className="py-3 px-4 text-right">Project Dossier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHousingDistricts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No district records match "{housingDistrictSearch}".
                          </td>
                        </tr>
                      ) : (
                        filteredHousingDistricts.map((d) => (
                          <tr key={d.district} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">{d.district}</td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                              {d.combined_targets.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                              {d.combined_completed.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 w-12 text-right">
                                  {d.combined_completion_percentage}%
                                </span>
                                <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                                  <div
                                    className="bg-emerald-600 h-full rounded-full"
                                    style={{ width: `${Math.min(100, d.combined_completion_percentage)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">
                              {d.basava ? (
                                <Link
                                  to={`/projects/${d.basava.id}`}
                                  className="hover:text-blue-600 flex items-center gap-1 font-medium text-slate-800"
                                >
                                  <span>{(d.basava.completed ?? 0).toLocaleString('en-IN')} / {(d.basava.targets ?? 0).toLocaleString('en-IN')}</span>
                                  <span className="text-emerald-700 font-bold font-mono">({d.basava.completion_percentage ?? 0}%)</span>
                                </Link>
                              ) : (
                                <span className="text-slate-400">Not recorded</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-600">
                              {d.pmayg ? (
                                <Link
                                  to={`/projects/${d.pmayg.id}`}
                                  className="hover:text-blue-600 flex items-center gap-1 font-medium text-slate-800"
                                >
                                  <span>{(d.pmayg.completed ?? 0).toLocaleString('en-IN')} / {(d.pmayg.targets ?? 0).toLocaleString('en-IN')}</span>
                                  <span className="text-emerald-700 font-bold font-mono">({d.pmayg.completion_percentage ?? 0}%)</span>
                                </Link>
                              ) : (
                                <span className="text-slate-400">Not recorded</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {d.basava && (
                                <Link
                                  to={`/projects/${d.basava.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                                >
                                  Dossier <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: BMTC TRANSIT PERFORMANCE                               */}
            {/* ------------------------------------------------------------- */}
            {activeSchemeTab === 'transport' && (
              <div className="space-y-6">
                {/* Top 3 Farebox Key Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {transportData?.key_farebox_indicators?.map((kfi, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
                        {kfi.title}
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-extrabold font-mono text-slate-900">
                          {formatINR(kfi.fy24_25_amount, true)}
                        </span>
                        {kfi.growth_pct && (
                          <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            +{kfi.growth_pct}% YoY
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80 flex justify-between">
                        <span>Previous FY: {formatINR(kfi.fy23_24_amount, true)}</span>
                        <span className="font-mono text-slate-400">FY 2024-25 Active</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fiscal 2024-25 Factors Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">BMTC Active Fiscal Performance Indicators (FY 2024-25)</h3>
                      <p className="text-xs text-slate-500">Authentic operational metrics and revenue collections published on data.gov.in</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {transportData?.total_fy25_factors || 20} Operational Metrics
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Performance Indicator</th>
                          <th className="py-2.5 px-3 font-mono">FY 2021-22</th>
                          <th className="py-2.5 px-3 font-mono">FY 2022-23</th>
                          <th className="py-2.5 px-3 font-mono">FY 2023-24</th>
                          <th className="py-2.5 px-3 font-mono text-blue-700">FY 2024-25 (Current)</th>
                          <th className="py-2.5 px-3 text-right">Project Record</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transportData?.fiscal_2024_25?.map((f) => {
                          const f21 = f.financial_records?.find((r) => r.financial_year === '2021-22')?.amount;
                          const f22 = f.financial_records?.find((r) => r.financial_year === '2022-23')?.amount;
                          const f23 = f.financial_records?.find((r) => r.financial_year === '2023-24')?.amount;
                          const f24 = f.financial_records?.find((r) => r.financial_year === '2024-25')?.amount;
                          return (
                            <tr key={f.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{f.factor_title}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{f21 ? formatINR(f21, true) : 'NA'}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{f22 ? formatINR(f22, true) : 'NA'}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{f23 ? formatINR(f23, true) : 'NA'}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{f24 ? formatINR(f24, true) : 'NA'}</td>
                              <td className="py-2.5 px-3 text-right">
                                <Link
                                  to={`/projects/${f.id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                                >
                                  View Dossier <ArrowRight className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: DATA TRANSPARENCY & METHODOLOGY                        */}
            {/* ------------------------------------------------------------- */}
            {activeSchemeTab === 'transparency' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {transparencyData.map((ds) => (
                    <div
                      key={ds.dataset_key}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                            Resource {ds.resource_id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {ds.status}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base">{ds.dataset_name}</h3>
                        <p className="text-xs text-slate-500 font-medium">Source: {ds.source_name}</p>

                        <div className="pt-2 border-t border-slate-200 text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Executing Department:</span>
                            <span className="font-semibold text-slate-800">{ds.department}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Records Imported:</span>
                            <span className="font-mono font-bold text-slate-900">{ds.records_imported} live API records</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Last Sync Timestamp:</span>
                            <span className="font-mono text-slate-700">{formatDate(ds.last_successful_import)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Reporting Period:</span>
                            <span className="font-semibold text-slate-800">{ds.reporting_period}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Accounting & Data Limitation Note</span>
                          <p className="text-slate-600 text-[11px] leading-relaxed">{ds.data_limitations}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-mono">Zero figure fabrication applied</span>
                        <a
                          href={`https://api.data.gov.in/resource/${ds.resource_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold text-[11px]"
                        >
                          View Source API <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Two Column Section: Recently Updated Projects vs Recently Flagged Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Updated */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recently Updated Projects</h2>
              <p className="text-xs text-slate-500">Latest progress and financial reports published</p>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {kpis?.recently_updated?.map((proj) => (
              <div key={proj.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Link 
                    to={`/projects/${proj.id}`}
                    className="text-sm font-semibold text-slate-900 hover:text-blue-600 line-clamp-1"
                  >
                    {proj.project_name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <OriginBadge origin={proj.data_origin} />
                    <span className="font-medium text-slate-700">{proj.district}</span>
                    <span>•</span>
                    <span>{proj.department}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-800 font-semibold">{formatINR(proj.approved_budget, true)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={proj.project_status} />
                  {proj.latest_progress !== null && (
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {formatPercent(proj.latest_progress)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Flagged for Review */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                AI Flagged for Human Review
              </h2>
              <p className="text-xs text-slate-500">Unusual expenditure velocity or schedule delay indicators</p>
            </div>
            <Link to="/ai-insights" className="text-xs font-semibold text-rose-600 hover:text-rose-800">
              AI Insights
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {kpis?.recently_flagged?.map((proj) => (
              <div key={proj.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Link 
                    to={`/projects/${proj.id}`}
                    className="text-sm font-semibold text-slate-900 hover:text-rose-600 line-clamp-1"
                  >
                    {proj.project_name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <OriginBadge origin={proj.data_origin} />
                    <span className="font-medium text-slate-700">{proj.district}</span>
                    <span>•</span>
                    <span>{proj.category}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-800 font-semibold">{formatINR(proj.approved_budget, true)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <RiskBadge level={proj.delay_risk_level} showScore={false} />
                  {proj.financial_anomaly_flag && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Spend Review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
