import { useEffect, useRef, useState, useCallback } from "react";
import { Body } from "~/components/Primitives/Body";
import { SmallBody } from "~/components/Primitives/SmallBody";
import { GeolocationData } from "~/utilities/formatDetectors";
import { PreviewBox } from "../PreviewBox";

declare global {
  interface Window {
    L: any;
    __leafletLoaded?: boolean;
    __leafletLoading?: boolean;
    __leafletCallbacks?: Array<() => void>;
  }
}

export type PreviewGeolocationProps = {
  data: GeolocationData;
};

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window not available"));
      return;
    }

    if (window.L) {
      resolve();
      return;
    }

    if (window.__leafletLoaded) {
      resolve();
      return;
    }

    if (window.__leafletLoading) {
      if (!window.__leafletCallbacks) {
        window.__leafletCallbacks = [];
      }
      window.__leafletCallbacks.push(resolve);
      return;
    }

    window.__leafletLoading = true;
    window.__leafletCallbacks = [resolve];

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      window.__leafletLoaded = true;
      window.__leafletLoading = false;
      const callbacks = window.__leafletCallbacks || [];
      callbacks.forEach((cb) => cb());
      window.__leafletCallbacks = undefined;
    };
    script.onerror = () => {
      window.__leafletLoading = false;
      reject(new Error("Failed to load Leaflet"));
    };
    document.head.appendChild(script);
  });
}

export function PreviewGeolocation({ data }: PreviewGeolocationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.L || mapInstanceRef.current) {
      return;
    }

    try {
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [data.latitude, data.longitude],
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.marker([data.latitude, data.longitude]).addTo(map);

      mapInstanceRef.current = map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    } catch (err) {
      setMapError(true);
    }
  }, [data.latitude, data.longitude]);

  useEffect(() => {
    if (!isVisible) return;

    loadLeaflet()
      .then(() => {
        setLeafletReady(true);
      })
      .catch(() => {
        setMapError(true);
      });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (leafletReady && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
  }, [leafletReady, initMap]);

  const mapsLink = `https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=13/${data.latitude}/${data.longitude}`;

  const formatCoordinate = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
  };

  return (
    <PreviewBox link={mapsLink}>
      <div ref={containerRef} className="space-y-3">
        <div>
          <Body className="font-medium">
            {formatCoordinate(data.latitude, data.longitude)}
          </Body>
          <SmallBody className="text-slate-500 dark:text-slate-400">
            {data.format === "dms" ? "DMS Format" : "Decimal Format"}
          </SmallBody>
        </div>

        {mapError ? (
          <div className="w-full h-64 rounded-sm bg-slate-200 dark:bg-slate-700 flex flex-col items-center justify-center gap-2">
            <svg
              className="w-12 h-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <SmallBody className="text-slate-500 dark:text-slate-400">
              Map temporarily unavailable
            </SmallBody>
            <div className="text-center mt-2 space-y-1">
              <SmallBody className="text-slate-500 dark:text-slate-400 font-mono">
                Latitude: {data.latitude.toFixed(6)}
              </SmallBody>
              <SmallBody className="text-slate-500 dark:text-slate-400 font-mono">
                Longitude: {data.longitude.toFixed(6)}
              </SmallBody>
            </div>
          </div>
        ) : (
          <div
            ref={mapRef}
            className="w-full h-64 rounded-sm bg-slate-200 dark:bg-slate-700"
            style={{ minHeight: "256px" }}
          >
            {!leafletReady && (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-400 border-t-transparent"></div>
                <SmallBody className="text-slate-500 dark:text-slate-400">
                  Loading map...
                </SmallBody>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
              Latitude
            </SmallBody>
            <Body className="font-mono">{data.latitude.toFixed(6)}</Body>
          </div>
          <div>
            <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
              Longitude
            </SmallBody>
            <Body className="font-mono">{data.longitude.toFixed(6)}</Body>
          </div>
        </div>

        <SmallBody className="text-xs text-slate-400 dark:text-slate-500">
          Click to view on OpenStreetMap
        </SmallBody>
      </div>
    </PreviewBox>
  );
}
