"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadResult {
  imported: number;
  skipped: number;
  accountId: string;
}

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setFile(files[0]);
    setResult(null);
    setError(null);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setResult(data);
      setFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Upload Statement</h1>
      <p className="text-muted-foreground text-sm">
        Upload a CSV export from DSK Bank. The account is detected automatically from the file.
        Duplicate transactions are skipped.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
            )}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          >
            <Upload className="mx-auto mb-3 text-muted-foreground" size={28} />
            <p className="text-sm text-muted-foreground">
              Drag & drop a CSV file here, or <span className="text-primary underline">browse</span>
            </p>
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm bg-muted rounded p-3">
              <FileText size={16} className="shrink-0" />
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-muted-foreground shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {result && (
            <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded p-3">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Upload successful</p>
                <p>{result.imported} transactions imported, {result.skipped} duplicates skipped.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded p-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
            {loading ? "Importing…" : "Import Transactions"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
