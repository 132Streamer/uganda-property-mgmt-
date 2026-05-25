"use client";

import { useCallback, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useDropzone } from "react-dropzone";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  tenancyId: string;
  existingDocumentId: string | null;
  onUploaded: () => void;
}

const BUCKET = "lease-documents";
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function LeaseUploader({
  tenancyId,
  existingDocumentId,
  onUploaded,
}: Props) {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length > 0) {
      toast.error("Only PDF files up to 20 MB are accepted.");
      return;
    }
    setFile(accepted[0]);
    setProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled: uploading,
  });

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setProgress(10);

    try {
      const ext = "pdf";
      const filePath = `${tenancyId}/${Date.now()}.${ext}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw uploadError;
      setProgress(60);

      if (existingDocumentId) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("lease_documents")
          .update({
            file_path: filePath,
            original_name: file.name,
            uploaded_at: new Date().toISOString(),
          })
          .eq("id", existingDocumentId);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("lease_documents")
          .insert({
            tenancy_id: tenancyId,
            file_path: filePath,
            original_name: file.name,
            uploaded_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      setProgress(100);
      toast.success("Lease uploaded successfully.");
      onUploaded();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">
          {isDragActive ? "Drop PDF here" : "Drag & drop PDF, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PDF only · max {MAX_SIZE_MB} MB
        </p>
      </div>

      {file && !uploading && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm truncate flex-1">{file.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {uploading && (
        <div className="space-y-1.5">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">
            Uploading…
          </p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading…
          </>
        ) : (
          "Upload Lease"
        )}
      </Button>
    </div>
  );
}
