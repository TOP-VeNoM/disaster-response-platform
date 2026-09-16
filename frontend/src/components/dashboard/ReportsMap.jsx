import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Maximize2, X } from 'lucide-react';
import { reportsApi } from '../../services/api/reports';
import { disasterTypeLabel } from '../../shared/disasterTypes.js';
import { urgencyLabel, urgencyColor } from '../../shared/urgencyLevels.js';
import { statusLabel, statusColor, formatRelativeTime } from '../../utils/formatters';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Below this zoom level, individual markers/clusters give way to a smoothed
// heatmap — matches the "zoom out shows a heatmap" behavior asked for.
// Above it, you're zoomed in enough that individual incident locations
// matter more than density, so markers + clustering take over instead.
const HEATMAP_ZOOM_THRESHOLD = 10;
const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;

/**
 * Groups markers into clusters at high zoom-out, matching Google's own
 * recommended pattern for @vis.gl/react-google-maps (the library doesn't
 * bundle clustering itself — @googlemaps/markerclusterer is the standard
 * companion package for this).
 */
function useClusteredMarkers(reports, onMarkerClick, onMarkerHover) {
  const map = useMap();
  const clustererRef = useRef(null);

  useEffect(() => {
    if (!map) return undefined;
    clustererRef.current = new MarkerClusterer({ map });
    return () => {
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!map || !clustererRef.current || !window.google) return;

    clustererRef.current.clearMarkers();

    const markers = reports.map((report) => {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: report.location.lat, lng: report.location.lng }
      });
      marker.addListener('click', () => onMarkerClick(report));
      marker.addListener('mouseenter', () => onMarkerHover(report));
      marker.addListener('mouseleave', () => onMarkerHover(null));
      return marker;
    });

    clustererRef.current.addMarkers(markers);
  }, [map, reports, onMarkerClick, onMarkerHover]);
}

/**
 * Renders as a heatmap instead of individual markers once zoomed out past
 * HEATMAP_ZOOM_THRESHOLD. Loads the 'visualization' Maps JS library
 * dynamically — it isn't included in the base SDK bundle.
 */
function HeatmapLayer({ reports, visible }) {
  const map = useMap();
  const visualizationLib = useMapsLibrary('visualization');
  const heatmapRef = useRef(null);

  useEffect(() => {
    if (!visualizationLib || !map) return undefined;
    heatmapRef.current = new visualizationLib.HeatmapLayer({ radius: 28, opacity: 0.65 });
    return () => heatmapRef.current?.setMap(null);
  }, [visualizationLib, map]);

  useEffect(() => {
    if (!heatmapRef.current) return;
    heatmapRef.current.setMap(visible ? map : null);
  }, [visible, map]);

  useEffect(() => {
    if (!heatmapRef.current || !window.google) return;
    const points = reports.map((r) => new window.google.maps.LatLng(r.location.lat, r.location.lng));
    heatmapRef.current.setData(points);
  }, [reports]);

  return null;
}

function ZoomWatcher({ onZoomChange }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google) return undefined;
    const listener = map.addListener('zoom_changed', () => onZoomChange(map.getZoom()));
    return () => window.google.maps.event.removeListener(listener);
  }, [map, onZoomChange]);

  return null;
}

function HoverCard({ report, onNavigate }) {
  if (!report) return null;

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 w-72 rounded-lg border border-surface-border bg-surface-card p-3 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-text-muted">{disasterTypeLabel(report.disasterType)}</span>
        {report.urgency && (
          <span className="badge text-white" style={{ backgroundColor: urgencyColor(report.urgency) }}>
            {urgencyLabel(report.urgency)}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-text-primary">
        {report.description.length > 100 ? `${report.description.slice(0, 100)}...` : report.description}
      </p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={`badge ${statusColor(report.status)}`}>{statusLabel(report.status)}</span>
        <span className="text-text-muted">{formatRelativeTime(report.createdAt)}</span>
      </div>
      <p className="pointer-events-auto mt-2 text-xs text-accent-mint" onClick={() => onNavigate(report._id)}>
        Click marker to view full report →
      </p>
    </div>
  );
}

/**
 * Thin wrapper so clustered markers only get created when heatmap mode is
 * OFF — avoids maintaining both a clusterer's worth of marker objects and a
 * heatmap layer's listeners simultaneously when only one is visible.
 */
function useClusteredMarkersWrapper(reports, heatmapActive, onClick, onHover) {
  useClusteredMarkers(heatmapActive ? [] : reports, onClick, onHover);
}

function MapInner({ reports, ungeocodableCount }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const showHeatmap = zoom < HEATMAP_ZOOM_THRESHOLD;

  const handleMarkerClick = useCallback((report) => navigate(`/reports/${report._id}`), [navigate]);
  const handleMarkerHover = useCallback((report) => setHovered(report), []);

  useClusteredMarkersWrapper(reports, showHeatmap, handleMarkerClick, handleMarkerHover);

  const center = useMemo(() => {
    if (reports.length === 0) return DEFAULT_CENTER;
    const avgLat = reports.reduce((s, r) => s + r.location.lat, 0) / reports.length;
    const avgLng = reports.reduce((s, r) => s + r.location.lng, 0) / reports.length;
    return { lat: avgLat, lng: avgLng };
  }, [reports]);

  return (
    <div className="relative h-full w-full">
      <Map
        mapId="disaster-response-map"
        defaultCenter={center}
        defaultZoom={reports.length > 0 ? 6 : DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        colorScheme="DARK"
      >
        <ZoomWatcher onZoomChange={setZoom} />
        <HeatmapLayer reports={reports} visible={showHeatmap} />
      </Map>

      <HoverCard report={hovered} onNavigate={(id) => navigate(`/reports/${id}`)} />

      {ungeocodableCount > 0 && (
        <div className="absolute bottom-4 left-4 z-10 rounded-md bg-surface-card px-3 py-2 text-xs text-text-secondary shadow-lg">
          {ungeocodableCount} report{ungeocodableCount !== 1 ? 's' : ''} could not be located on the map
        </div>
      )}
    </div>
  );
}

export default function ReportsMap() {
  const [reports, setReports] = useState([]);
  const [ungeocodableCount, setUngeocodableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reportsApi
      .getMapData()
      .then((data) => {
        if (cancelled) return;
        setReports(data.geocoded.filter((r) => r.location?.lat && r.location?.lng));
        setUngeocodableCount(data.ungeocodableCount || 0);
      })
      .catch((err) => !cancelled && setError(err.response?.data?.error || err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Escape key closes full-page mode, matching standard modal/lightbox behavior
  useEffect(() => {
    if (!expanded) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') setExpanded(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expanded]);

  if (!API_KEY || API_KEY === 'your_google_maps_api_key_here') {
    return (
      <div className="flex h-64 items-center justify-center rounded-md bg-surface-tile text-center text-sm text-text-muted">
        Map unavailable — set VITE_GOOGLE_MAPS_API_KEY in frontend/.env to enable the report location map.
      </div>
    );
  }

  const mapContent = loading ? (
    <div className="flex h-full items-center justify-center text-sm text-text-muted">Loading report locations...</div>
  ) : error ? (
    <div className="flex h-full items-center justify-center text-sm text-status-critical">{error}</div>
  ) : (
    <APIProvider apiKey={API_KEY}>
      <MapInner reports={reports} ungeocodableCount={ungeocodableCount} />
    </APIProvider>
  );

  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-page p-4">
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          {mapContent}
          <button
            onClick={() => setExpanded(false)}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-md bg-surface-card text-text-secondary shadow-lg hover:text-text-primary"
            title="Close full-page map (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg">
      {mapContent}
      <button
        onClick={() => setExpanded(true)}
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-surface-card text-text-secondary shadow-lg hover:text-text-primary"
        title="Expand to full page"
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );
}
