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
};

function extractBankCode(iban: string, countryCode: string): string | null {
  const bankInfo = BANK_IDENTIFIERS[countryCode];
  if (!bankInfo) return null;

  const [start, end] = bankInfo.position;
  return iban.substring(start, end);
}

export function PreviewIBAN({ data }: PreviewIBANProps) {
  const bankCode = extractBankCode(data.iban, data.countryCode);
  const bankIdentifierInfo = BANK_IDENTIFIERS[data.countryCode];

  return (
    <PreviewBox>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{data.flag}</span>
          <div>
            <Body className="font-medium">{data.countryName}</Body>
            <SmallBody className="text-slate-500 dark:text-slate-400">
              Country Code: {data.countryCode}
            </SmallBody>
          </div>
        </div>

        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-sm">
          <Body className="font-mono text-lg tracking-wider">
            {data.formatted}
          </Body>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
              Check Digits
            </SmallBody>
            <Body className="font-mono">{data.iban.substring(2, 4)}</Body>
          </div>

          {bankCode && (
            <div>
              <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
                {bankIdentifierInfo?.name || "Bank Code"}
              </SmallBody>
              <Body className="font-mono">{bankCode}</Body>
            </div>
          )}

          <div className="col-span-2">
            <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
              Account Number (BBAN)
            </SmallBody>
            <Body className="font-mono text-sm">
              {data.iban.substring(4)}
            </Body>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <SmallBody className="text-xs text-slate-400 dark:text-slate-500">
            IBAN is {data.iban.length} characters long • Valid format ✓
          </SmallBody>
        </div>
      </div>
    </PreviewBox>
  );
}
