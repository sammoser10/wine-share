"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/proposals");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-app-gradient min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-accent"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C11.5 2 11 2.19 10.59 2.59L7.29 5.88C6.5 6.67 6 7.83 6 9C6 11.21 7.79 13 10 13V22H14V13C16.21 13 18 11.21 18 9C18 7.83 17.5 6.67 16.71 5.88L13.41 2.59C13 2.19 12.5 2 12 2Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Compartir</h1>
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    </div>
  );
}
