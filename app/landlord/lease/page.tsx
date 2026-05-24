"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FileText, Upload, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import LeaseUploader from "@/components/lease/LeaseUploader";

interface Tenancy {
  id: string;
  unit_number: string;
  tenant_name: string;
  tenant_email: string;
  start_date: string;
  end_date: string;
  lease_document?: {
    id: string;
    file_path: string;
    uploaded_at: string;
    original_name: string;
  } | null;
}

export default function LandlordLeasePage() {
  const supabase = createClientComponentClient();
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  async function fetchTenancies() {
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
        tenant_name,
        tenant_email,
        start_date,
        end_date,
        lease_documents (
          id,
          file_path,
          uploaded_at,
          original_name
        )
      `
      )
      .eq("landlord_id", user.id)
      .order("start_date", { ascending: false });

    if (!error && data) {
      const mapped: Tenancy[] = data.map((t: any) => ({
        ...t,
        lease_document: t.lease_documents?.[0] ?? null,
      }));
      setTenancies(mapped);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchTenancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleUploaded(tenancyId: string) {
    setOpenDialog(null);
    fetchTenancies();
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Lease Documents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload and manage lease PDFs for each tenancy.
        </p>
      </div>

      {tenancies.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            No active tenancies found.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tenancies.map((tenancy) => (
          <Card key={tenancy.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">
                  Unit {tenancy.unit_number} —{" "}
                  <span className="font-normal text-foreground">
                    {tenancy.tenant_name}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {tenancy.tenant_email}
                </CardDescription>
                <p className="text-xs text-muted-foreground">
                  {new Date(tenancy.start_date).toLocaleDateString()} →{" "}
                  {new Date(tenancy.end_date).toLocaleDateString()}
                </p>
              </div>

              {tenancy.lease_document ? (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Lease uploaded
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 shrink-0 text-muted-foreground"
                >
                  <Clock className="h-3.5 w-3.5" />
                  No lease
                </Badge>
              )}
            </CardHeader>

            <CardContent className="pt-0 flex items-center justify-between">
              {tenancy.lease_document ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-xs">
                    {tenancy.lease_document.original_name}
                  </span>
                  <span className="text-xs shrink-0">
                    · Uploaded{" "}
                    {new Date(
                      tenancy.lease_document.uploaded_at
                    ).toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No document attached.
                </span>
              )}

              <Dialog
                open={openDialog === tenancy.id}
                onOpenChange={(open) =>
                  setOpenDialog(open ? tenancy.id : null)
                }
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="ml-4 shrink-0">
                    <Upload className="h-4 w-4 mr-2" />
                    {tenancy.lease_document ? "Replace Lease" : "Upload Lease"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      Upload Lease — Unit {tenancy.unit_number}
                    </DialogTitle>
                  </DialogHeader>
                  <LeaseUploader
                    tenancyId={tenancy.id}
                    existingDocumentId={tenancy.lease_document?.id ?? null}
                    onUploaded={() => handleUploaded(tenancy.id)}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}