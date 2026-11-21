import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, LayoutDashboard, FolderKanban, MapPin, 
  BarChart3, Sparkles, Database, ShieldAlert, LogOut, 
  Menu, X, ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = api.getCurrentUser();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects Directory', icon: FolderKanban },
    { to: '/map', label: 'Karnataka Map', icon: MapPin },
    { to: '/analytics', label: 'Financial Analytics', icon: BarChart3 },
    { to: '/ai-insights', label: 'AI Risk Engine', icon: Sparkles },
    { to: '/sources', label: 'Sources', icon: Database },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Karnataka Official Civic Top Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600"></span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="font-semibold text-white tracking-wide">Government of Karnataka Public Accountability Portal</span>
          <span className="hidden md:inline text-slate-400">| e-Governance Civic Initiative</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE AUDIT RECORDS
          </span>
          {currentUser ? (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
              <span className="text-white font-medium">{currentUser.username} ({currentUser.role})</span>
              <button
                onClick={() => { api.logout(); window.location.href = '/'; }}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-1"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-slate-300 hover:text-white flex items-center gap-1">
              Admin Login
            </Link>
          )}
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.svg" alt="CivicTrack" className="w-9 h-9 shadow-sm rounded-lg" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight">CivicTrack</span>
                <span className="text-xs font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Karnataka
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">AI-Powered Public Project Transparency</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Admin Dashboard Pill */}
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-2 ${
                isActive('/admin')
                  ? 'bg-rose-900 text-white'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Admin Portal
            </Link>
          </nav>

          {/* Mobile hamburger button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium ${
                  active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 mt-2"
          >
            <ShieldAlert className="w-4 h-4" />
            Admin Portal & CSV Upload
          </Link>
        </div>
      )}
    </header>
  );
}
