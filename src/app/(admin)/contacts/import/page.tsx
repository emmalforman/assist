"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importContacts } from "@/lib/actions";

export default function ImportContactsPage() {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: number } | null>(null);

  function parseCSV(text: string) {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return;

    const headerLine = lines[0];
    const hdrs = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    setHeaders(hdrs);

    const rows: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      hdrs.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }

    setPreview(rows);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  }

  function handlePaste(text: string) {
    setCsvText(text);
    parseCSV(text);
  }

  async function handleImport() {
    setImporting(true);
    const res = await importContacts(preview);
    setResult(res);
    setImporting(false);
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Import Contacts</h1>
        <p className="text-sm text-muted mt-1">
          Upload a CSV or paste data. Supported columns: firstName (or name), lastName, email, company,
          role (or title), linkedinUrl (or linkedin), source, tags, notes.
        </p>
      </div>

      {result ? (
        <div className="max-w-2xl">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-emerald-800 mb-3">Import Complete</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{result.created}</p>
                <p className="text-xs text-emerald-600">Created</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                <p className="text-xs text-amber-600">Skipped (duplicates)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                <p className="text-xs text-red-600">Errors</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => router.push("/contacts")}
                className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                View Contacts
              </button>
              <button
                onClick={() => { setResult(null); setPreview([]); setCsvText(""); }}
                className="text-sm text-muted px-4 py-2 rounded-lg border border-border"
              >
                Import More
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl space-y-6">
          {/* Upload area */}
          <div className="bg-card-bg border-2 border-dashed border-border rounded-xl p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="text-muted mb-2">
                <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-700">Drop a CSV file or click to upload</p>
              <p className="text-xs text-muted mt-1">Or paste CSV data below</p>
            </label>
          </div>

          {/* Paste area */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Or paste CSV data</label>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => handlePaste(e.target.value)}
              placeholder={`firstName,lastName,email,company,role,source,tags\nSarah,Chen,sarah@example.com,Verve,Head of Partnerships,linkedin,"food-tech,coffee"`}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-zinc-900">
                  Preview ({preview.length} contacts)
                </p>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
                >
                  {importing ? "Importing..." : `Import ${preview.length} contacts`}
                </button>
              </div>
              <div className="bg-card-bg border border-border rounded-xl overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-zinc-50/50">
                      {headers.map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50">
                        {headers.map((h) => (
                          <td key={h} className="px-4 py-2 text-xs text-zinc-700 truncate max-w-[200px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-xs text-muted text-center py-2">...and {preview.length - 10} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
