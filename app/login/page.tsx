import LoginForm from "./LoginForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login | Remivo",
  description: "Sign in to access the Remivo admin dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-[#030712] relative overflow-hidden">
      {/* Background blobs for premium depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]" />

      <div className="relative z-10 w-full flex flex-col items-center px-4">
        <LoginForm />
        <Link href="/" className="mt-8 text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center gap-2">
          ← Back to Remivo home
        </Link>
      </div>
    </div>
  );
}
