import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, AlertTriangle, ArrowRight, 
  Building2, MapPin, DollarSign, PieChart as PieIcon, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Legend, LineChart, Line, CartesianGrid 
} from 'recharts';
import { api } from '../services/api';
import { formatINR, formatPercent } from '../utils/formatters';

export default function AnalyticsPage() {
  const [districtStats, setDistrictStats] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverviewKPIs(),
      api.getDistrictStats(),
      api.getDepartmentStats(),
      api.getAnomalies()
    ])
      .then(([kpiData, distData, deptData, anomData]) => {
        setKpis(kpiData);
        setDistrictStats(distData);
        setDepartmentStats(deptData);
        setAnomalies(anomData);
      })
      .catch((err) => console.error("Error loading analytics", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Aggregating financial analytics across Karnataka...</p>
      </div>
    );
  }

  // Department comparison chart data (in Crores)
  const deptChartData = departmentStats.slice(0, 7).map((d) => ({
    name: d.department.length > 20 ? d.department.substring(0, 18) + '...' : d.department,
    "Approved Budget": Number((Number(d.approved_budget) / 10000000).toFixed(1)),
    "Reported Spend": Number((Number(d.reported_expenditure) / 10000000).toFixed(1)),
  }));

  // District comparison data
  const distChartData = districtStats.slice(0, 8).map((d) => ({
    name: d.district,
    "Approved Budget": Number((Number(d.approved_budget) / 10000000).toFixed(1)),
    "Reported Spend": Number((Number(d.reported_expenditure) / 10000000).toFixed(1)),
  }));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Module 6</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Financial Transparency Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Segregated analysis of Approved Budgets, Released Funds, Awarded Values, and Published Expenditures.
          </p>
        </div>
      </div>

      {/* Accounting Disclaimers & Integrity Pillars */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          Strict Accounting Distinction (Section 6 & 13 Compliance)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-amber-400 font-bold block mb-1">Approved Budget</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">The statutory maximum sanctioned by administrative order.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-emerald-400 font-bold block mb-1">Funds Released</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">Actual cash transferred from treasury to implementing bank accounts.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-purple-400 font-bold block mb-1">Reported Expenditure</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">Audited voucher payments for certified work completed.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-blue-400 font-bold block mb-1">Awarded Contract</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">Agreed legal agreement amount with the executing contractor.</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Financial Analysis */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Department Allocations & Expenditure</h2>
            <p className="text-xs text-slate-500">Comparing administrative sanction to voucher spend (in ₹ Crores)</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip 
                  formatter={(val) => `₹${val} Cr`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Approved Budget" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Reported Spend" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Financial Utilization */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">District-wise Financial Volume</h2>
            <p className="text-xs text-slate-500">Top 8 districts with active public works (in ₹ Crores)</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(val) => `₹${val} Cr`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Approved Budget" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Reported Spend" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Unusual Spending Pattern Review Table (Section 5 Module 6 & Module 7B) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Unusual Spending-Pattern Flags (Requires Administrative Review)
            </h2>
            <p className="text-xs text-slate-500">
              Generated by deterministic variance rules and Isolation Forest anomaly models.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
            {anomalies.length} Records Identified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Reported Spend</th>
                <th className="py-3 px-4">Physical Progress</th>
                <th className="py-3 px-4">Review Reason</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {anomalies.map((a) => (
                <tr key={a.project_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                    {a.project_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{a.district}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatINR(a.approved_budget, true)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                    {formatINR(a.reported_expenditure, true)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                    {a.reported_progress !== null ? formatPercent(a.reported_progress) : "N/A"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-md">
                    <span className="line-clamp-2 text-[11px] leading-relaxed">{a.reason}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/projects/${a.project_id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5"
                    >
                      Inspect <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
