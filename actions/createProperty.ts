"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type CreatePropertyState = {
  error?: string;
  success?: boolean;
};

export async function createProperty(
  _prev: CreatePropertyState,
  formData: FormData
): Promise<CreatePropertyState> {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
        setAll(cookiesToSet: { name: any; value: any; options: any; }[]) {
          cookiesToSet.forEach(async ({ name, value, options }) =>
            (await cookieStore).set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please log in." };
  }

  // 2. Confirm landlord role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "landlord") {
    return { error: "Only landlords can create properties." };
  }

  // 3. Parse form fields
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const address = formData.get("address") as string;
  const district = formData.get("district") as string;
  const city = formData.get("city") as string;
  const monthly_rent = parseFloat(formData.get("monthly_rent") as string);
  const currency = (formData.get("currency") as string) || "UGX";
  const bedrooms = parseInt(formData.get("bedrooms") as string) || null;
  const bathrooms = parseInt(formData.get("bathrooms") as string) || null;
  const property_type = formData.get("property_type") as string;
  const photosRaw = formData.get("photos") as string; // JSON array of uploaded URLs
  const photos: string[] = photosRaw ? JSON.parse(photosRaw) : [];

  // 4. Validate required fields
  if (!title || !address || !district || !city || isNaN(monthly_rent)) {
    return {
      error: "Title, address, district, city, and monthly rent are required.",
    };
  }

  // 5. Insert into properties table
  const { data, error: insertError } = await supabase
    .from("properties")
    .insert({
      landlord_id: user.id,
      title,
      description: description || null,
      address,
      district,
      city,
      monthly_rent,
      currency,
      bedrooms,
      bathrooms,
      property_type: property_type || null,
      photos,
      status: "available",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Property insert error:", insertError);
    return { error: insertError.message };
  }

  // 6. Revalidate dashboard and redirect
  revalidatePath("/dashboard/landlord/properties");
  redirect(`/dashboard/landlord/properties/${data.id}`);
}