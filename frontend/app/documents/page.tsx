"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, Upload, Loader2 } from "lucide-react";
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
    setError(null);
    setExplanation(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/documents/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUploading(false);
      setExplaining(true);
      const explainRes = await api.post(`/documents/${uploadRes.data.id}/explain?language=${lang}`);
      setExplanation(explainRes.data.explanation);
    } catch (e: any) {
      setError(getApiErrorMessage(e));
    } finally {
      setUploading(false);
      setExplaining(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <FileSearch className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">
          {lang === "ne" ? "कागजात व्याख्या" : "Legal Document Explainer"}
        </h1>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {lang === "ne"
          ? "हाल यो सुविधाले टेक्स्ट-आधारित PDF मात्र समर्थन गर्छ। स्क्यान गरिएको फोटो/इमेज OCR अझै थपिएको छैन।"
          : "Currently this feature only supports text-based PDFs. Scanned image OCR is not yet implemented."}
      </p>

      <Card className="mt-6">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 hover:border-crimson-300">
          <Upload size={22} className="text-slate-400" />
          {file ? file.name : lang === "ne" ? "PDF छान्नुहोस्" : "Choose a PDF"}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <Button
          onClick={handleUploadAndExplain}
          loading={uploading || explaining}
          disabled={!file}
          className="mt-4 w-full"
        >
          {uploading ? (lang === "ne" ? "अपलोड हुँदैछ…" : "Uploading…") : explaining ? (lang === "ne" ? "व्याख्या गरिँदैछ…" : "Explaining…") : lang === "ne" ? "व्याख्या गर्नुहोस्" : "Upload & Explain"}
        </Button>
      </Card>

      {error && (
        <div className="mt-5">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {explanation && (
        <Card className="mt-6">
          <h3 className="font-display text-base font-semibold text-ink">{lang === "ne" ? "सरल व्याख्या" : "Plain-language explanation"}</h3>
          <p className="lang-ne mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{explanation}</p>
        </Card>
      )}
    </div>
  );
}
