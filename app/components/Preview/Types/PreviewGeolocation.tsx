import { useEffect, useRef, useState } from "react";
import { Body } from "~/components/Primitives/Body";
import { SmallBody } from "~/components/Primitives/SmallBody";
import { GeolocationData } from "~/utilities/formatDetectors";
import { PreviewBox } from "../PreviewBox";

declare global {
  interface Window {
    L: any;
  }
}

export type PreviewGeolocationProps = {
  data: GeolocationData;
};

export function PreviewGeolocation({ data }: PreviewGeolocationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else if (window.L) {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapLoaded) return;

    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current).setView(
      [data.latitude, data.longitude],
      13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.marker([data.latitude, data.longitude]).addTo(map);

    setMapLoaded(true);

    return () => {
      map.remove();
    };
  }, [leafletLoaded, data.latitude, data.longitude, mapLoaded]);

  const mapsLink = `https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=13/${data.latitude}/${data.longitude}`;

  return (
    <PreviewBox link={mapsLink}>
      <div className="space-y-3">
        <div>
          <Body className="font-medium">
            {data.latitude.toFixed(6)}°, {data.longitude.toFixed(6)}°
          </Body>
          <SmallBody className="text-slate-500 dark:text-slate-400">
            Latitude: {data.latitude.toFixed(6)}, Longitude:{" "}
            {data.longitude.toFixed(6)}
          </SmallBody>
        </div>
        <div
          ref={mapRef}
          className="w-full h-64 rounded-sm bg-slate-200 dark:bg-slate-700"
        >
          {!leafletLoaded && (
            <div className="flex items-center justify-center h-full">
              <SmallBody className="text-slate-500 dark:text-slate-400">
                Loading map...
              </SmallBody>
            </div>
          )}
        </div>
        <SmallBody className="text-xs text-slate-400 dark:text-slate-500">
          Click to view on OpenStreetMap
        </SmallBody>
      </div>
    </PreviewBox>
  );
}
