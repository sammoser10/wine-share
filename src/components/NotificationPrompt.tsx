"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!user) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    // Show prompt after a delay
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleEnable = async () => {
    setEnabling(true);
    const granted = await requestNotificationPermission();
    if (granted && user) {
      const subscription = await subscribeToPush();
      if (subscription) {
        await savePushSubscription(user.id, subscription);
      }
    }
    setShow(false);
    setEnabling(false);
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="glass-card p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-wine/30 border border-wine-glow/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-wine-glow"
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
            <p className="text-xs text-white/40 mt-0.5">
              Get notified about new proposals and friend requests
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={enabling}
                className="wine-btn px-3 py-1.5 text-xs"
              >
                {enabling ? "Enabling..." : "Enable"}
              </button>
              <button
                onClick={() => setShow(false)}
                className="glass-btn px-3 py-1.5 text-xs text-white/40"
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
