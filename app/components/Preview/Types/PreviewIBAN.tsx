import { useMemo } from "react";
import { Body } from "~/components/Primitives/Body";
import { Title } from "~/components/Primitives/Title";
import { PreviewBox } from "../PreviewBox";
import { getCountryInfo, ibanCountryData } from "~/utilities/customFormats";

export type PreviewIBANProps = {
  iban: string;
  countryCode: string;
  bankCode?: string;
  accountNumber?: string;
  valid: boolean;
};

export function PreviewIBAN({
  iban,
  countryCode,
  bankCode,
  accountNumber,
  valid,
}: PreviewIBANProps) {
  const countryInfo = useMemo(() => getCountryInfo(countryCode), [countryCode]);

  const formattedIBAN = useMemo(() => {
    return iban.replace(/(.{4})/g, "$1 ").trim();
  }, [iban]);

  return (
    <div>
      <PreviewBox>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Title className="text-slate-700 dark:text-slate-400">
              International Bank Account Number
            </Title>
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                valid
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {valid ? "✓ Valid" : "✗ Invalid"}
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
            <div className="text-4xl flex-shrink-0">
              {countryInfo?.flag || "🏳️"}
            </div>
            <div className="flex-1 min-w-0">
              <Body className="font-medium text-slate-800 dark:text-slate-200">
                {countryInfo?.countryName || `Country: ${countryCode}`}
              </Body>
              <Body className="text-sm text-slate-500 dark:text-slate-400">
                {countryInfo ? `Country Code: ${countryCode}` : "Unknown country"}
              </Body>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <Body className="text-sm text-slate-500 dark:text-slate-500 mb-1">
                IBAN
              </Body>
              <Body className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-800 dark:text-slate-200 break-all">
                {formattedIBAN}
              </Body>
            </div>

            {bankCode && (
              <div>
                <Body className="text-sm text-slate-500 dark:text-slate-500 mb-1">
                  Bank Code
                </Body>
                <Body className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-800 dark:text-slate-200">
                  {bankCode}
                </Body>
              </div>
            )}

            {accountNumber && (
              <div>
                <Body className="text-sm text-slate-500 dark:text-slate-500 mb-1">
                  Account Number
                </Body>
                <Body className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-800 dark:text-slate-200">
                  {accountNumber}
                </Body>
              </div>
            )}
          </div>

          {countryInfo && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <Body className="text-sm text-slate-500 dark:text-slate-500">
                <span className="font-medium">IBAN Structure for {countryInfo.countryName}:</span>
              </Body>
              <div className="mt-1 flex flex-wrap gap-2">
                <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900 rounded text-xs font-mono">
                  <span className="text-blue-600 dark:text-blue-300">{countryCode}</span>
                  <span className="text-slate-500 dark:text-slate-400"> (Country)</span>
                </div>
                <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded text-xs font-mono">
                  <span className="text-slate-600 dark:text-slate-300">XX</span>
                  <span className="text-slate-500 dark:text-slate-400"> (Check)</span>
                </div>
                {countryInfo.bankCodeLength && (
                  <div className="px-2 py-1 bg-green-50 dark:bg-green-900 rounded text-xs font-mono">
                    <span className="text-green-600 dark:text-green-300">
                      {"X".repeat(countryInfo.bankCodeLength)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400"> (Bank)</span>
                  </div>
                )}
                <div className="px-2 py-1 bg-purple-50 dark:bg-purple-900 rounded text-xs font-mono">
                  <span className="text-purple-600 dark:text-purple-300">...</span>
                  <span className="text-slate-500 dark:text-slate-400"> (Account)</span>
                </div>
              </div>
              <Body className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Total length: {countryInfo.length} characters
              </Body>
            </div>
          )}
        </div>
      </PreviewBox>
    </div>
  );
}
