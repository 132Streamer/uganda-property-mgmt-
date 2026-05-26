"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Role = "landlord" | "tenant";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("tenant");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }, // stored in user_metadata
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Redirect based on role
    router.push(role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10">
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-[#B07D4F]">
            Uganda Property
          </span>
          <h1 className="mt-2 text-4xl font-bold text-[#1A1A1A] leading-tight">
            Create account
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-3">
              I am a
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["landlord", "tenant"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`
                    relative py-4 px-5 rounded-xl border-2 text-left transition-all duration-150
                    ${
                      role === r
                        ? "border-[#B07D4F] bg-[#B07D4F] text-white shadow-lg"
                        : "border-[#D9D0C0] bg-white text-[#333] hover:border-[#B07D4F]"
                    }
                  `}
                >
                  <span className="block text-lg font-bold capitalize">{r}</span>
                  <span className={`block text-xs mt-0.5 ${role === r ? "text-orange-100" : "text-[#999]"}`}>
                    {r === "landlord" ? "List & manage properties" : "Find & rent properties"}
                  </span>
                  {role === r && (
                    <span className="absolute top-3 right-3 text-white text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#D9D0C0] bg-white text-[#1A1A1A] placeholder-[#BBB] focus:outline-none focus:border-[#B07D4F] transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold tracking-widest uppercase text-[#555] mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#D9D0C0] bg-white text-[#1A1A1A] placeholder-[#BBB] focus:outline-none focus:border-[#B07D4F] transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-[#1A1A1A] text-white font-bold tracking-wide text-sm uppercase hover:bg-[#B07D4F] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#777]">
          Already have an account?{" "}
          <a href="/login" className="text-[#B07D4F] font-semibold hover:underline">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}