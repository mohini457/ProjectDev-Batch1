"use client";

import { Suspense } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import AuthLayout, { clerkAppearance } from "@/components/ui/auth-layout";

function AuthContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  return (
    <AuthLayout>
      {mode === "sign-up" ? (
        <SignUp
          routing="hash"
          fallbackRedirectUrl="/"
          signInUrl="/auth"
          appearance={clerkAppearance}
        />
      ) : (
        <SignIn
          routing="hash"
          fallbackRedirectUrl="/"
          signUpUrl="/auth?mode=sign-up"
          appearance={clerkAppearance}
        />
      )}
    </AuthLayout>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#F5F7FA] to-[#E2E8F0]">
          <div className="w-8 h-8 border-2 border-[#0553BA] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
