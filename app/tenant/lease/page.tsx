"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FileText, Download, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface LeaseDocument {
  id: string;
  file_path: string;
  original_name: string;
  uploaded_at: string;
}

interface Tenancy {
  id: string;
  unit_number: string;
  start_date: string;
  end_date: string;
  lease_document: LeaseDocument | null;
}

export default function TenantLeasePage() {
  const supabase = createClientComponentClient();
  const [tenancy, setTenancy] = useState<Tenancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchTenancy() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tenancies")
        .select(
          `
          id,
          unit_number,
          start_date,
          end_date,
          lease_documents (
            id,
            file_path,
            original_name,
            uploaded_at
          )
        `
        )
        .eq("tenant_id", user.id)
        .order("start_date", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setTenancy({
          ...data,
          lease_document: (data as any).lease_documents?.[0] ?? null,
        });
      }

      setLoading(false);
    }

    fetchTenancy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDownload() {
    if (!tenancy?.lease_document) return;

    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from("lease-documents")
        .createSignedUrl(tenancy.lease_document.file_path, 60); // 60-second expiry

      if (error || !data?.signedUrl) {
        throw new Error(error?.message ?? "Failed to generate download link.");
      }

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = tenancy.lease_document.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      toast.error(err.message ?? "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Your Lease
        </h1>
        {tenancy && (
          <p className="text-sm text-muted-foreground mt-1">
            Unit {tenancy.unit_number} ·{" "}
            {new Date(tenancy.start_date).toLocaleDateString()} →{" "}
            {new Date(tenancy.end_date).toLocaleDateString()}
          </p>
        )}
      </div>

      {!tenancy ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            No active tenancy found.
          </CardContent>
        </Card>
      ) : tenancy.lease_document ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-muted p-2">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-base font-medium">
                  {tenancy.lease_document.original_name}
                </CardTitle>
                <CardDescription className="text-xs">
                  Uploaded{" "}
                  {new Date(
                    tenancy.lease_document.uploaded_at
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full sm:w-auto"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Lease
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <p className="font-medium text-sm">No lease uploaded yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Your landlord hasn&apos;t uploaded a lease document. Contact them
              if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}