"use client";

import { useAuth } from "@/components/AuthProvider";
import { BottomNav } from "@/components/BottomNav";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-app-gradient">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-app-gradient">
      <NotificationPrompt />
      <main className="flex-1 pb-20 safe-top">{children}</main>
      <BottomNav />
    </div>
  );
}
