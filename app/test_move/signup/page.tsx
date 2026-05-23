"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { signUpWithEmail } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const signupSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["landlord", "tenant"], {
    required_error: "Select a role",
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "tenant" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (formData: SignupFormData) => {
    setServerError(null);
    try {
      await signUpWithEmail(
        formData.email,
        formData.password,
        formData.role,
        formData.full_name,
        formData.phone
      );
      router.push(
        formData.role === "landlord" ? "/landlord/dashboard" : "/tenant/portal"
      );
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Signup failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Fill in details to get started.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="Jane Doe"
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+256 700 000000"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <RadioGroup
                value={selectedRole}
                onValueChange={(val) =>
                  setValue("role", val as "landlord" | "tenant", {
                    shouldValidate: true,
                  })
                }
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="tenant" id="tenant" />
                  <Label htmlFor="tenant" className="cursor-pointer font-normal">
                    Tenant
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="landlord" id="landlord" />
                  <Label htmlFor="landlord" className="cursor-pointer font-normal">
                    Landlord
                  </Label>
                </div>
              </RadioGroup>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Sign Up"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have account?{" "}
              <Link href="/login" className="underline hover:text-foreground">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
