"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  requestNotificationPermission,
  subscribeToPush,
  savePushSubscription,
} from "@/lib/notifications";

export function NotificationPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const dismiss = useCallback(() => {
    setShow(false);
    setEnabling(false);
    // Remember dismissal so it doesn't re-appear this session
    try {
      sessionStorage.setItem("notif-dismissed", "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    try {
      if (sessionStorage.getItem("notif-dismissed")) return;
    } catch {}

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [user]);

  // Dismiss when returning from the OS permission dialog
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && enabling) {
        // Permission was answered — dismiss regardless of outcome
        dismiss();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabling, dismiss]);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted && user) {
        const subscription = await subscribeToPush();
        if (subscription) {
          await savePushSubscription(user.id, subscription);
        }
      }
    } catch {
      // Permission denied or error — still dismiss
    }
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="glass-card p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Enable Notifications</p>
            <p className="text-xs text-muted mt-0.5">
              Get notified about new proposals and friend requests
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={enabling}
                className="accent-btn px-3 py-1.5 text-xs"
              >
                {enabling ? "Enabling..." : "Enable"}
              </button>
              <button
                onClick={dismiss}
                className="glass-btn px-3 py-1.5 text-xs text-muted"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
