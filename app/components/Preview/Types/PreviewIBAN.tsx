import { useState, useEffect } from "react";
import { Body } from "~/components/Primitives/Body";
import { SmallBody } from "~/components/Primitives/SmallBody";
import { IBANData, IBAN_COUNTRIES } from "~/utilities/formatDetectors";
import { PreviewBox } from "../PreviewBox";

export type PreviewIBANProps = {
  data: IBANData;
};

interface BankIdentifierInfo {
  name: string;
  position: [number, number];
}

const BANK_IDENTIFIERS: Record<string, BankIdentifierInfo> = {
  DE: {
    name: "Bankleitzahl (BLZ)",
    position: [4, 12],
  },
  GB: {
    name: "Bank Identifier Code (BIC)",
    position: [4, 8],
  },
  FR: {
    name: "Code Banque",
    position: [4, 9],
  },
  ES: {
    name: "Código Bancario",
    position: [4, 8],
  },
  IT: {
    name: "Codice ABI",
    position: [5, 10],
  },
  NL: {
    name: "Bank Identifier",
    position: [4, 8],
  },
  BE: {
    name: "Bank Code",
    position: [4, 7],
  },
  AT: {
    name: "Bankleitzahl",
    position: [4, 9],
  },
  CH: {
    name: "Banken-Code",
    position: [4, 9],
  },
  SE: {
    name: "Bank Code",
    position: [4, 7],
  },
  NO: {
    name: "Bank Code",
    position: [4, 8],
  },
  DK: {
    name: "Bank Code",
    position: [4, 8],
  },
  FI: {
    name: "Bank Code",
    position: [4, 7],
  },
  PL: {
    name: "Numer Rozliczeniowy",
    position: [4, 12],
  },
  PT: {
    name: "Código do Banco",
    position: [4, 8],
  },
  IE: {
    name: "Bank Identifier",
    position: [4, 8],
  },
  LU: {
    name: "Bank Code",
    position: [4, 7],
  },
  AE: {
    name: "Bank Code",
    position: [4, 7],
  },
  SA: {
    name: "Bank Code",
    position: [4, 6],
  },
  EG: {
    name: "Bank Code",
    position: [4, 8],
  },
};

function extractBankCode(iban: string, countryCode: string): string | null {
  const bankInfo = BANK_IDENTIFIERS[countryCode];
  if (!bankInfo) return null;

  const [start, end] = bankInfo.position;
  return iban.substring(start, end);
}

function getCountryColors(countryCode: string): { primary: string; secondary: string } {
  const countryInfo = IBAN_COUNTRIES[countryCode];
  const color = countryInfo?.color || "#6B7280";
  
  return {
    primary: color,
    secondary: color,
  };
}

function isFlagEmojiSupported(): boolean {
  if (typeof window === "undefined") return true;
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return true;
  
  const flag = "🇺🇳";
  ctx.font = "16px Arial";
  
  const metrics = ctx.measureText(flag);
  const width = metrics.width;
  
  return width > 8;
}

export function PreviewIBAN({ data }: PreviewIBANProps) {
  const [flagSupported, setFlagSupported] = useState(true);
  const bankCode = extractBankCode(data.iban, data.countryCode);
  const bankIdentifierInfo = BANK_IDENTIFIERS[data.countryCode];
  const colors = getCountryColors(data.countryCode);

  useEffect(() => {
    setFlagSupported(isFlagEmojiSupported());
  }, []);

  const CountryIndicator = () => {
    if (flagSupported) {
      return (
        <span className="text-5xl leading-none">{data.flag}</span>
      );
    }

    return (
      <div className="relative w-16 h-12 rounded-sm overflow-hidden flex items-center justify-center border border-slate-300 dark:border-slate-600">
        <div
          className="absolute inset-0"
          style={{ backgroundColor: colors.primary }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-white font-bold text-xl tracking-wider" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
            {data.countryCode}
          </span>
        </div>
      </div>
    );
  };

  return (
    <PreviewBox>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <CountryIndicator />
          <div className="flex-1">
            <Body className="font-medium text-lg">{data.countryName}</Body>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {data.countryCode}
              </span>
              <SmallBody className="text-slate-500 dark:text-slate-400">
                IBAN
              </SmallBody>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-sm">
          <Body className="font-mono text-lg tracking-wider break-all">
            {data.formatted}
          </Body>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
              Check Digits
            </SmallBody>
            <Body className="font-mono text-lg">{data.iban.substring(2, 4)}</Body>
          </div>

          {bankCode && (
            <div>
              <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
                {bankIdentifierInfo?.name || "Bank Code"}
              </SmallBody>
              <Body className="font-mono text-lg">{bankCode}</Body>
            </div>
          )}

          {!bankCode && (
            <div>
              <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
                Length
              </SmallBody>
              <Body className="font-mono text-lg">{data.iban.length} chars</Body>
            </div>
          )}

          <div className="col-span-2">
            <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
              Basic Bank Account Number (BBAN)
            </SmallBody>
            <Body className="font-mono text-sm break-all">
              {data.iban.substring(4).replace(/(.{4})/g, '$1 ').trim()}
            </Body>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <SmallBody className="text-emerald-600 dark:text-emerald-400 font-medium">
              Valid IBAN Format
            </SmallBody>
            <SmallBody className="text-slate-400 dark:text-slate-500">
              • Checksum verified
            </SmallBody>
          </div>
        </div>
      </div>
    </PreviewBox>
  );
}
