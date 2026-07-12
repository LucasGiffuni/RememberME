import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await request.json();

    // Upsert subscription for user
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Supabase error:", error);
      return Response.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
