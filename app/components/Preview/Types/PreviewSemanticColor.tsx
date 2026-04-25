import { useMemo } from "react";
import Color from "color";
import { Body } from "~/components/Primitives/Body";
import { Title } from "~/components/Primitives/Title";
import { PreviewBox } from "../PreviewBox";
import { cssColorNames } from "~/utilities/customFormats";

export type PreviewSemanticColorProps = {
  colorName: string;
  hexValue: string;
};

export function PreviewSemanticColor({ colorName, hexValue }: PreviewSemanticColorProps) {
  const colorInfo = useMemo(() => {
    try {
      const color = Color(hexValue);
      return {
        hex: color.hex(),
        rgb: color.rgb().string(),
        hsl: color.hsl().string(),
        isLight: color.isLight(),
        luminosity: color.luminosity(),
        red: color.red(),
        green: color.green(),
        blue: color.blue(),
        alpha: color.alpha(),
      };
    } catch {
      return null;
    }
  }, [hexValue]);

  const textColor = colorInfo?.isLight ? "text-slate-800" : "text-slate-100";

  const similarColors = useMemo(() => {
    if (!colorInfo) return [];

    const targetColor = Color(hexValue);
    const colors = Object.entries(cssColorNames)
      .filter(([name]) => name !== colorName.toLowerCase())
      .map(([name, hex]) => {
        const c = Color(hex);
        const distance = colorDistance(targetColor, c);
        return { name, hex, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);

    return colors;
  }, [hexValue, colorName, colorInfo]);

  return (
    <div>
      <PreviewBox>
        <div className="space-y-4">
          <div>
            <Title className="text-slate-700 dark:text-slate-400 mb-2">
              CSS Color: <span className="font-mono">{colorName}</span>
            </Title>
          </div>

          <div
            className={`w-full h-40 rounded-lg flex items-center justify-center shadow-inner ${textColor}`}
            style={{ backgroundColor: hexValue }}
          >
            <div className="text-center">
              <Body className={`text-lg font-medium ${textColor}`}>
                {colorName}
              </Body>
              <Body className={`font-mono text-sm mt-1 ${textColor} opacity-80`}>
                {hexValue.toUpperCase()}
              </Body>
            </div>
          </div>

          {colorInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <Body className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                  HEX
                </Body>
                <Body className="font-mono text-sm text-slate-800 dark:text-slate-200">
                  {colorInfo.hex}
                </Body>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <Body className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                  RGB
                </Body>
                <Body className="font-mono text-sm text-slate-800 dark:text-slate-200">
                  {colorInfo.rgb}
                </Body>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <Body className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                  HSL
                </Body>
                <Body className="font-mono text-sm text-slate-800 dark:text-slate-200">
                  {colorInfo.hsl}
                </Body>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <Body className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                  Luminosity
                </Body>
                <Body className="font-mono text-sm text-slate-800 dark:text-slate-200">
                  {colorInfo.luminosity.toFixed(4)}
                  <span className="text-xs ml-1 text-slate-500 dark:text-slate-500">
                    ({colorInfo.isLight ? "Light" : "Dark"})
                  </span>
                </Body>
              </div>
            </div>
          )}

          {colorInfo && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: `rgb(${colorInfo.red}, 0, 0)` }}
                  />
                  <div>
                    <Body className="text-xs text-slate-500 dark:text-slate-500">
                      Red
                    </Body>
                    <Body className="font-mono text-sm text-slate-800 dark:text-slate-200">
                      {colorInfo.red}
                    </Body>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: `rgb(0, ${colorInfo.green}, 0)` }}
                  />
                  <div>
                    <Body className="text-xs text-slate-500 dark:text-slate-500">
                      Green
                    </Body>
                    <Body className="font-mono text-sm text-slate-800 dark:text-slate-200">
                      {colorInfo.green}
                    </Body>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: `rgb(0, 0, ${colorInfo.blue})` }}
                  />
                  <div>
                    <Body className="text-xs text-slate-500 dark:text-slate-500">
                      Blue
                    </Body>
                    <Body className="font-mono text-sm text-slate-800 dark:text-slate-200">
                      {colorInfo.blue}
                    </Body>
                  </div>
                </div>
              </div>
            </div>
          )}

          {similarColors.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <Body className="text-sm text-slate-500 dark:text-slate-500 mb-2">
                Similar CSS Colors
              </Body>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {similarColors.map(({ name, hex }) => (
                  <div
                    key={name}
                    className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                    title={`${name}: ${hex}`}
                  >
                    <div
                      className="w-full h-10 rounded-md shadow-sm mb-1"
                      style={{ backgroundColor: hex }}
                    />
                    <Body className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {name}
                    </Body>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <Body className="text-xs text-slate-500 dark:text-slate-400">
              CSS Level 3 & SVG 1.0 named color. Supports 147 standard color names.
            </Body>
          </div>
        </div>
      </PreviewBox>
    </div>
  );
}

function colorDistance(c1: Color, c2: Color): number {
  const r1 = c1.red();
  const g1 = c1.green();
  const b1 = c1.blue();
  const r2 = c2.red();
  const g2 = c2.green();
  const b2 = c2.blue();

  const rmean = (r1 + r2) / 2;
  const r = r1 - r2;
  const g = g1 - g2;
  const b = b1 - b2;

  return Math.sqrt(
    (2 + rmean / 256) * r * r + 4 * g * g + (2 + (255 - rmean) / 256) * b * b
  );
}
