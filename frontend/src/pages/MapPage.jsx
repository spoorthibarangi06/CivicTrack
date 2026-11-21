import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { MapPin, Filter, Layers, Info, ExternalLink, ChevronRight, Building2 } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import RiskBadge from '../components/common/RiskBadge';
import OriginBadge from '../components/common/OriginBadge';
import { formatINR, formatPercent } from '../utils/formatters';

const KARNATAKA_CENTER = [14.5, 75.8]; // Centroid of Karnataka state
const KARNATAKA_ZOOM = 7;

const KARNATAKA_DISTRICTS = [
  "All Districts", "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
  "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga",
  "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri",
  "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur",
  "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara",
  "Vijayapura", "Yadgir"
];

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapPage() {
  const [mapProjects, setMapProjects] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [mapCenter, setMapCenter] = useState(KARNATAKA_CENTER);
  const [mapZoom, setMapZoom] = useState(KARNATAKA_ZOOM);

  useEffect(() => {
    setLoading(true);
    api.getMapProjects({
      district: selectedDistrict === 'All Districts' ? '' : selectedDistrict,
      category: selectedCategory === 'all' ? '' : selectedCategory,
    })
      .then((data) => {
        setMapProjects(data);
        if (data.length > 0 && selectedDistrict !== 'All Districts') {
          // Center on first project of district
          setMapCenter([data[0].latitude, data[0].longitude]);
          setMapZoom(9);
        } else {
          setMapCenter(KARNATAKA_CENTER);
          setMapZoom(KARNATAKA_ZOOM);
        }
      })
      .catch((err) => console.error("Failed to load map data", err))
      .finally(() => setLoading(false));
  }, [selectedDistrict, selectedCategory]);

  const getMarkerColor = (item) => {
    if (item.risk_level === 'HIGH') return '#EF4444'; // Red
    if (item.project_status === 'COMPLETED') return '#10B981'; // Green
    if (item.risk_level === 'MEDIUM') return '#F59E0B'; // Amber
    return '#3B82F6'; // Blue
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Module 5</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Interactive Karnataka Geo-Map</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grounded spatial visualization. Markers with dashed rings indicate approximate district centroids.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            {KARNATAKA_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map + Sidebar Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[640px]">
        {/* Leaflet Map (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <MapFlyTo center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mapProjects.map((p) => {
              const color = getMarkerColor(p);
              const isApprox = p.location_precision === 'APPROXIMATE_DISTRICT';

              return (
                <CircleMarker
                  key={p.id}
                  center={[p.latitude, p.longitude]}
                  radius={isApprox ? 9 : 8}
                  pathOptions={{
                    color: isApprox ? '#D97706' : '#1E293B',
                    weight: isApprox ? 2 : 1.5,
                    dashArray: isApprox ? '4, 4' : null,
                    fillColor: color,
                    fillOpacity: 0.85,
                  }}
                  eventHandlers={{
                    click: () => setSelectedProject(p),
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-2 max-w-[240px]">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{p.district}</span>
                        <div className="flex items-center gap-1">
                          <OriginBadge origin={p.data_origin} />
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isApprox ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                            {isApprox ? 'Approx Centroid' : 'Exact GPS'}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">
                        {p.project_name}
                      </h4>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <p>Budget: <strong>{formatINR(p.approved_budget, true)}</strong></p>
                        <p>Progress: <strong>{p.latest_progress !== null ? formatPercent(p.latest_progress) : "N/A"}</strong></p>
                      </div>
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-1"
                      >
                        View Project Dossier <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Map Legend</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-slate-700">Ongoing Project</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-700">Completed in Source</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-slate-700">High Delay / Anomaly Risk</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500">
              <span className="border-b border-dashed border-amber-600 font-semibold text-amber-700">Dashed ring:</span> Approximate district centroid
            </div>
          </div>
        </div>

        {/* Selected Project or Sidebar List (1 Col) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                {selectedDistrict} ({mapProjects.length})
              </h2>
              {selectedProject && (
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Show all
                </button>
              )}
            </div>

            {selectedProject ? (
              /* Selected Project Focus */
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-mono text-slate-500">{selectedProject.district}</span>
                    <div className="flex items-center gap-1.5">
                      <OriginBadge origin={selectedProject.data_origin} />
                      <StatusBadge status={selectedProject.project_status} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {selectedProject.project_name}
                  </h3>
                  <p className="text-xs text-slate-600">{selectedProject.department}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Approved Budget:</span>
                    <span className="font-bold font-mono text-slate-900">{formatINR(selectedProject.approved_budget, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Physical Progress:</span>
                    <span className="font-bold font-mono text-blue-700">
                      {selectedProject.latest_progress !== null ? formatPercent(selectedProject.latest_progress) : "Not available in source"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location Accuracy:</span>
                    <span className="font-semibold text-slate-700">
                      {selectedProject.location_precision === 'EXACT' ? 'Verified GPS Coordinates' : 'Approximate District Centroid'}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/projects/${selectedProject.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  Open Full Project Dossier
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              /* District List of Projects */
              <div className="divide-y divide-slate-100">
                {mapProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProject(p);
                      setMapCenter([p.latitude, p.longitude]);
                      setMapZoom(11);
                    }}
                    className="py-3 cursor-pointer hover:bg-slate-50 rounded-lg px-2 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">{p.district}</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(p.approved_budget, true)}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 hover:text-blue-600">
                      {p.project_name}
                    </h4>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>Strict Geo-verification: Only verified coordinates are plotted. Approximate centroids are distinctly demarcated.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
