import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, Filter, X, ChevronLeft, ChevronRight, SlidersHorizontal, 
  Building2, MapPin, Calendar, ExternalLink, ArrowUpDown, LayoutGrid, List
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import RiskBadge from '../components/common/RiskBadge';
import OriginBadge from '../components/common/OriginBadge';
import { formatINR, formatPercent, formatDate } from '../utils/formatters';

const KARNATAKA_DISTRICTS = [
  "All Districts", "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
  "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga",
  "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri",
  "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur",
  "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara",
  "Vijayapura", "Yadgir"
];

const DEPARTMENTS = [
  "All Departments", "Housing Department", "Transport Department",
  "Public Works Department", "Rural Development & Panchayat Raj",
  "Water Resources Department", "Karnataka Urban Water Supply and Drainage Board",
  "Karnataka Road Development Corporation", "Health & Family Welfare Department",
  "Tourism and Public Works Department", "Urban Development Department"
];

const CATEGORIES = [
  "All Categories", "Affordable Housing & Social Welfare", "Rural Housing & Welfare",
  "Urban Mass Transit & Public Fleet", "Roads & Bridges", "Rural Water Supply",
  "Urban Drainage & Flood Mitigation", "Urban Mass Transit", "Irrigation & Canals",
  "Healthcare Infrastructure", "Agricultural Infrastructure",
  "Ports & Coastal Protection", "Rural Infrastructure"
];

const STATUSES = ["All Statuses", "ONGOING", "COMPLETED", "DELAYED", "PLANNED"];
const ORIGINS = ["All Data Origins", "OFFICIAL_REPORT_IMPORT", "SAMPLE_DATA", "LIVE_API"];

export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectsData, setProjectsData] = useState({ total: 0, projects: [], total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Filter States
  const search = searchParams.get('search') || '';
  const district = searchParams.get('district') || '';
  const department = searchParams.get('department') || '';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';
  const origin = searchParams.get('origin') || '';
  const sortBy = searchParams.get('sort_by') || 'recent';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    setLoading(true);
    api.getProjects({
      search,
      district: district === 'All Districts' ? '' : district,
      department: department === 'All Departments' ? '' : department,
      category: category === 'All Categories' ? '' : category,
      status: status === 'All Statuses' ? '' : status,
      origin: origin === 'All Data Origins' ? '' : origin,
      sort_by: sortBy,
      page,
      limit: 12,
    })
      .then((data) => setProjectsData(data))
      .catch((err) => console.error("Failed to load projects", err))
      .finally(() => setLoading(false));
  }, [search, district, department, category, status, origin, sortBy, page]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'All' && !value.startsWith('All ')) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(search || district || department || category || status || origin || sortBy !== 'recent');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Module 3</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Government Project Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Searchable repository of Karnataka infrastructure and welfare works. Missing values display as "Not available in source".
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              hasActiveFilters
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && `(Active)`}
          </button>
        </div>
      </div>

      {/* Search and Quick Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by project name, ID, taluk, or executing department..."
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Quick District Select */}
          <select
            value={district || 'All Districts'}
            onChange={(e) => updateParam('district', e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {KARNATAKA_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Quick Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => updateParam('sort_by', e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 text-xs font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="recent">Sort by Recently Updated</option>
            <option value="budget_desc">Budget (High to Low)</option>
            <option value="budget_asc">Budget (Low to High)</option>
            <option value="name">Project Name (A-Z)</option>
          </select>
        </div>

        {/* Filter Drawer / Expanded Filter Options */}
        {filterDrawerOpen && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Department</label>
              <select
                value={department || 'All Departments'}
                onChange={(e) => updateParam('department', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 text-xs border border-slate-200"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Project Category</label>
              <select
                value={category || 'All Categories'}
                onChange={(e) => updateParam('category', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 text-xs border border-slate-200"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Reported Status</label>
              <select
                value={status || 'All Statuses'}
                onChange={(e) => updateParam('status', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 text-xs border border-slate-200"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Data Origin</label>
              <select
                value={origin || 'All Data Origins'}
                onChange={(e) => updateParam('origin', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 text-xs border border-slate-200"
              >
                {ORIGINS.map((og) => (
                  <option key={og} value={og}>{og}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                "{search}"
                <button onClick={() => updateParam('search', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {district && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                District: {district}
                <button onClick={() => updateParam('district', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {department && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                Dept: {department}
                <button onClick={() => updateParam('department', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                {category}
                <button onClick={() => updateParam('category', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                Status: {status}
                <button onClick={() => updateParam('status', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {origin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                Origin: {origin}
                <button onClick={() => updateParam('origin', '')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-rose-600 hover:text-rose-800 font-semibold underline text-xs ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Project Counts Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong>{projectsData.projects.length}</strong> of <strong>{projectsData.total}</strong> government records
        </span>
        <span>Page {page} of {projectsData.total_pages}</span>
      </div>

      {/* Projects List Content */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Querying database records...</p>
        </div>
      ) : projectsData.projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No matching projects found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your district, category, or search keywords to view other Karnataka records.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg mt-2"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projectsData.projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    {proj.source_record_id}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <OriginBadge origin={proj.data_origin} />
                    <StatusBadge status={proj.project_status} />
                  </div>
                </div>

                <Link
                  to={`/projects/${proj.id}`}
                  className="font-bold text-slate-900 text-base hover:text-blue-600 line-clamp-2 leading-snug"
                >
                  {proj.project_name}
                </Link>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{proj.district}{proj.taluk ? `, ${proj.taluk}` : ''}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({proj.location_precision === 'EXACT' ? 'Exact GPS' : 'District Centroid'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{proj.department}</span>
                  </div>
                </div>

                {/* Financial & Progress Pill */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Approved Budget</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatINR(proj.approved_budget, true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Physical Progress</span>
                    <span className="font-bold text-blue-700 font-mono">
                      {proj.latest_progress !== null ? formatPercent(proj.latest_progress) : "Not available in source"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                <RiskBadge level={proj.delay_risk_level} />
                <Link
                  to={`/projects/${proj.id}`}
                  className="text-xs font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1"
                >
                  Dossier
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Project ID & Title</th>
                  <th className="py-3 px-4">District / Taluk</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Data Origin</th>
                  <th className="py-3 px-4">Approved Budget</th>
                  <th className="py-3 px-4">Reported Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Delay Risk</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectsData.projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-mono text-[10px] text-slate-400 block">{p.source_record_id}</span>
                      <Link to={`/projects/${p.id}`} className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1">
                        {p.project_name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 block">{p.district}</span>
                      <span className="text-slate-500 text-[11px]">{p.taluk || "Not available"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-[180px] truncate">
                      {p.department}
                    </td>
                    <td className="py-3.5 px-4">
                      <OriginBadge origin={p.data_origin} />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatINR(p.approved_budget, true)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {p.latest_progress !== null ? formatPercent(p.latest_progress) : "Not available in source"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.project_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={p.delay_risk_level} showScore={false} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/projects/${p.id}`}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-semibold text-slate-800 text-[11px] inline-flex items-center gap-0.5"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {projectsData.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            disabled={page <= 1}
            onClick={() => updateParam('page', page - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-slate-500">
            Page <strong>{page}</strong> of <strong>{projectsData.total_pages}</strong>
          </span>
          <button
            disabled={page >= projectsData.total_pages}
            onClick={() => updateParam('page', page + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
