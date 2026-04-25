import { JSONStringType } from "@jsonhero/json-infer-types/lib/@types";
import {
  JSONColorFormat,
  JSONJSONFormat,
} from "@jsonhero/json-infer-types/lib/formats";
import Color from "color";
import { useMemo } from "react";
import { CodeViewer } from "~/components/CodeViewer";
import { recognizeCustomFormat } from "~/utilities/customFormats";
import { PreviewBox } from "../PreviewBox";
import { PreviewAudioUri } from "./PreviewAudioUri";
import { PreviewDate } from "./PreviewDate";
import { PreviewGeoCoordinate } from "./PreviewGeoCoordinate";
import { PreviewIBAN } from "./PreviewIBAN";
import { PreviewImageUri } from "./PreviewImageUri";
import { PreviewIPFSImage } from "./PreviewIPFSImage";
import { PreviewISBN } from "./PreviewISBN";
import { PreviewRegex } from "./PreviewRegex";
import { PreviewSemanticColor } from "./PreviewSemanticColor";
import { PreviewUri } from "./PreviewUri";
import { PreviewVideoUri } from "./PreviewVideoUri";

export function PreviewString({ info }: { info: JSONStringType }) {
  const customFormat = useMemo(() => recognizeCustomFormat(info.value), [info.value]);

  if (customFormat) {
    switch (customFormat.type) {
      case "geoCoordinate":
        return (
          <PreviewGeoCoordinate
            latitude={customFormat.latitude}
            longitude={customFormat.longitude}
          />
        );
      case "isbn":
        return <PreviewISBN isbn={customFormat.isbn} variant={customFormat.variant} />;
      case "iban":
        return (
          <PreviewIBAN
            iban={customFormat.iban}
            countryCode={customFormat.countryCode}
            bankCode={customFormat.bankCode}
            accountNumber={customFormat.accountNumber}
            valid={customFormat.valid}
          />
        );
      case "regex":
        return (
          <PreviewRegex pattern={customFormat.pattern} flags={customFormat.flags} />
        );
      case "semanticColor":
        return (
          <PreviewSemanticColor
            colorName={customFormat.colorName}
            hexValue={customFormat.hexValue}
          />
        );
    }
  }

  if (info.format == null) {
    return <></>;
  }

  switch (info.format.name) {
    case "uri":
      if (
        info.format.contentType === "image/png" ||
        info.format.contentType === "image/jpeg" ||
        info.format.contentType === "image/gif" ||
        info.format.contentType === "image/svg+xml" ||
        info.format.contentType === "image/webp"
      ) {
        const url = new URL(info.value);

        if (url.protocol === "ipfs:") {
          return <PreviewIPFSImage src={url} />;
        } else {
          return (
            <PreviewImageUri
              src={info.value}
              contentType={info.format.contentType}
            />
          );
        }
      } else if (
        info.format.contentType === "video/mp4" ||
        info.format.contentType === "video/webm" ||
        info.format.contentType === "video/ogg"
      ) {
        return (
          <PreviewVideoUri
            src={info.value}
            contentType={info.format.contentType}
          />
        );
      } else if (
        info.format.contentType === "audio/mpeg" ||
        info.format.contentType === "audio/ogg" ||
        info.format.contentType === "audio/wav"
      ) {
        return (
          <PreviewAudioUri
            src={info.value}
            contentType={info.format.contentType}
          />
        );
      } else {
        return <PreviewUri value={info.value} type={info} />;
      }
    case "datetime":
      if (info.format.parts === "date" || info.format.parts === "datetime") {
        return <PreviewDate value={info.value} format={info.format} />;
      }
      return <></>;
    case "color":
      return <PreviewColor value={info.value} format={info.format} />;
    case "json":
      return <PreviewJson value={info.value} format={info.format} />;
    default:
      return <></>;
  }
}

function PreviewJson({
  value,
  format,
}: {
  value: string;
  format: JSONJSONFormat;
}) {
  if (format.variant === "json5") {
    return <></>;
  }

  return <CodeViewer code={JSON.stringify(JSON.parse(value), null, 2)} />;
}

function PreviewColor({
  value,
  format,
}: {
  value: string;
  format: JSONColorFormat;
}) {
  const color = new Color(value);

  const textColor = color.isLight() ? "text-slate-800" : "text-slate-100";

  return (
    <>
      <PreviewBox>
        <div>
          <div
            className="flex items-center justify-center w-full h-52"
            style={{ backgroundColor: color.hex().toString() }}
          >
            <p className={`text-center text-xl ${textColor}`}>{value}</p>
          </div>
        </div>
      </PreviewBox>
    </>
  );
}
