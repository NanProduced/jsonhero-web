import { useMemo } from "react";
import { Body } from "~/components/Primitives/Body";
import { Title } from "~/components/Primitives/Title";
import { PreviewBox } from "../PreviewBox";

export type PreviewGeoCoordinateProps = {
  latitude: number;
  longitude: number;
};

export function PreviewGeoCoordinate({ latitude, longitude }: PreviewGeoCoordinateProps) {
  const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;

  const tileInfo = useMemo(() => {
    return getMapTiles(latitude, longitude, 12);
  }, [latitude, longitude]);

  return (
    <div>
      <PreviewBox link={osmLink}>
        <div className="space-y-3">
          <div>
            <Title className="text-slate-700 dark:text-slate-400 mb-1">
              Geographic Coordinates
            </Title>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Latitude: </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {latitude.toFixed(6)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Longitude: </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {longitude.toFixed(6)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-3 gap-0" style={{ width: "100%", aspectRatio: "3/2" }}>
              {tileInfo.tiles.map((tile, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden bg-slate-100 dark:bg-slate-800"
                  style={{ aspectRatio: "1/1" }}
                >
                  <img
                    src={tile.url}
                    alt={`Map tile ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
              <div className="w-1 h-4 bg-red-500 mx-auto -mt-1" />
            </div>
          </div>

          <Body className="text-xs text-slate-500 dark:text-slate-400">
            Map data © OpenStreetMap contributors. Click to view on OpenStreetMap.
          </Body>
        </div>
      </PreviewBox>
    </div>
  );
}

interface TileInfo {
  x: number;
  y: number;
  z: number;
  url: string;
}

function getMapTiles(lat: number, lon: number, zoom: number): { center: TileInfo; tiles: TileInfo[] } {
  const centerTile = latLonToTile(lat, lon, zoom);

  const tiles: TileInfo[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = centerTile.x + dx;
      const y = centerTile.y + dy;

      const maxTile = Math.pow(2, zoom);
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      const wrappedY = ((y % maxTile) + maxTile) % maxTile;

      tiles.push({
        x: wrappedX,
        y: wrappedY,
        z: zoom,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${wrappedY}.png`,
      });
    }
  }

  return {
    center: centerTile,
    tiles,
  };
}

function latLonToTile(lat: number, lon: number, zoom: number): TileInfo {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const xTile = Math.floor(((lon + 180) / 360) * n);
  const yTile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );

  return {
    x: xTile,
    y: yTile,
    z: zoom,
    url: `https://tile.openstreetmap.org/${zoom}/${xTile}/${yTile}.png`,
  };
}
