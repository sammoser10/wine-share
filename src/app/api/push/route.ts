import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      "mailto:hello@compartir.app",
      publicKey,
      privateKey
    );
  }

  return webpush;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url } = await request.json();
    const push = getWebPush();

    const supabase = await createServerSupabaseClient();

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const payload = JSON.stringify({ title, body, url });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        push.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;

    return NextResponse.json({ sent });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
