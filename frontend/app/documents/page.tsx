"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, Upload, Loader2, FileText, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Card, Alert } from "@/components/ui";

export default function DocumentsPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadAndExplain = async () => {
    if (!user) return router.push("/login?next=/documents");
    if (!file) return;
    setError(null); setExplanation(null); setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const up = await api.post("/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setUploading(false); setExplaining(true);
      const ex = await api.post(`/documents/${up.data.id}/explain?language=${lang}`);
      setExplanation(ex.data.explanation);
    } catch (e: any) { setError(getApiErrorMessage(e)); }
    finally { setUploading(false); setExplaining(false); }
  };

  const step = uploading ? "upload" : explaining ? "explain" : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">{lang === "ne" ? "कागजात" : "Documents"}</span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          {lang === "ne" ? "कागजात व्याख्या" : "Legal Document Explainer"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "ne" ? "PDF अपलोड गर्नुहोस् — AI ले सरल भाषामा व्याख्या गर्नेछ।" : "Upload a PDF — AI will explain it in plain language."}
        </p>
      </div>

      <div className="animate-fade-up [animation-delay:60ms] flex items-start gap-2 rounded-2xl border border-brass-100 bg-brass-50 px-4 py-3 mb-5">
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-brass-500" />
        <p className="text-xs text-slate-600">
          {lang === "ne" ? "यस सुविधाले हाल टेक्स्ट-आधारित PDF मात्र समर्थन गर्छ। स्क्यान गरिएको इमेज OCR थपिँदैछ।" : "Currently supports text-based PDFs only. Scanned image OCR is being added."}
        </p>
      </div>

      <Card className="animate-fade-up [animation-delay:100ms]">
        <label className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 text-center transition-all duration-300 ${
          file ? "border-ink bg-slate-50" : "border-slate-200 hover:border-ink"
        }`}>
          {file ? (
            <>
              <FileText size={28} className="text-ink" />
              <div>
                <p className="font-medium text-ink text-sm">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <p className="text-xs text-slate-400">{lang === "ne" ? "फेर्न यहाँ थिच्नुहोस्" : "Click to change"}</p>
            </>
          ) : (
            <>
              <Upload size={28} className="text-slate-400" />
              <div>
                <p className="font-medium text-ink text-sm">{lang === "ne" ? "PDF छान्नुहोस्" : "Choose a PDF"}</p>
                <p className="text-xs text-slate-400 mt-1">{lang === "ne" ? "वा यहाँ छोड्नुहोस्" : "or drag and drop here"}</p>
              </div>
            </>
          )}
          <input type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </label>

        <Button onClick={handleUploadAndExplain} disabled={!file || !!step} loading={!!step} className="mt-4 w-full" size="lg">
          {step === "upload" ? (lang === "ne" ? "अपलोड हुँदैछ…" : "Uploading…")
            : step === "explain" ? (lang === "ne" ? "विश्लेषण गर्दैछ…" : "Analyzing…")
            : (lang === "ne" ? "व्याख्या गर्नुहोस्" : "Upload & Explain")}
        </Button>
      </Card>

      {error && <div className="mt-5 animate-fade-in"><Alert variant="error">{error}</Alert></div>}

      {explanation && (
        <Card className="mt-6 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <FileSearch size={16} />
            </span>
            <h3 className="font-display text-base font-semibold text-ink">
              {lang === "ne" ? "सरल व्याख्या" : "Plain-language explanation"}
            </h3>
          </div>
          <p className="lang-ne whitespace-pre-line text-sm leading-relaxed text-ink">{explanation}</p>
        </Card>
      )}
    </div>
  );
}
