import { NextRequest } from "next/server";
import { webpush } from "@/lib/push";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, title, body } = await request.json();

    // Get user's push subscription
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return Response.json({ error: "No subscription found" }, { status: 404 });
    }

    const subscription = JSON.parse(data.subscription);

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: title || "RememberME",
        body: body || "Tienes un recordatorio",
        icon: "/icons/icon-192x192.svg",
        badge: "/icons/icon-192x192.svg",
        url: "/",
      })
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Push send error:", error);
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}
