import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink, Database, Info, GitFork } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: System info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="CivicTrack Logo" className="w-7 h-7 rounded" />
              <span className="font-bold text-white text-base">CivicTrack Karnataka</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-Powered Government Project Transparency & Accountability System tracking public works across Karnataka, India.
            </p>
            <div className="pt-2 text-[11px] text-slate-500 font-mono">
              Prototype Version 1.0 (Hackathon MVP)
            </div>
          </div>

          {/* Col 2: Official Government Sources */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-300 tracking-wider mb-3">
              Grounded Government Sources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://egramswaraj.gov.in/" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
                  eGramSwaraj (Panchayat GPDP) <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://kppp.karnataka.gov.in/" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
                  Karnataka Procurement Portal (KPPP) <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://karnataka.data.gov.in/" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
                  Karnataka Open Data Portal <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://data.gov.in/" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
                  National Open Gov Data (OGD) <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a href="https://pfms.nic.in/" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
                  Public PFMS Treasury Reports <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-300 tracking-wider mb-3">
              Application Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard" className="hover:text-white">Citizen KPI Dashboard</Link></li>
              <li><Link to="/projects" className="hover:text-white">Project Directory & Filters</Link></li>
              <li><Link to="/map" className="hover:text-white">Interactive Karnataka Geo-Map</Link></li>
              <li><Link to="/analytics" className="hover:text-white">Financial Transparency Analytics</Link></li>
              <li><Link to="/ai-insights" className="hover:text-white">Delay Risk & Anomaly Engine</Link></li>
              <li><Link to="/admin" className="hover:text-white">Administrative CSV/Excel Ingestion</Link></li>
            </ul>
          </div>

          {/* Col 4: Public Data Integrity Notice */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Civic Ethics & Transparency</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Data is aggregated strictly from publicly accessible government publications. Missing fields display as <em>"Not available in source"</em> rather than assumed zeroes.
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400 pt-1">
              AI flags indicate statistical discrepancies requiring human administrative review and do not constitute accusations of misconduct.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CivicTrack Karnataka. Designed for Public Accountability & Citizen Engagement.</p>
          <div className="flex items-center gap-4">
            <Link to="/sources" className="hover:text-slate-300">Data Methodology</Link>
            <span>•</span>
            <Link to="/admin" className="hover:text-slate-300">Admin Control Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
