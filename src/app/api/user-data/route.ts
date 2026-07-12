import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_data")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found, which is ok for new users
      console.error("Supabase error:", error);
      return Response.json({ error: "Database error" }, { status: 500 });
    }

    if (!data) {
      // Return empty data for new users
      return Response.json({ tasks: [], agenda: [], events: [] });
    }

    return Response.json({
      tasks: JSON.parse(data.tasks || "[]"),
      agenda: JSON.parse(data.agenda || "[]"),
      events: JSON.parse(data.events || "[]"),
    });
  } catch (error) {
    console.error("GET user-data error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tasks, agenda, events } = body;

    const { error } = await supabase
      .from("user_data")
      .upsert(
        {
          user_id: userId,
          tasks: JSON.stringify(tasks || []),
          agenda: JSON.stringify(agenda || []),
          events: JSON.stringify(events || []),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Supabase error:", error);
      return Response.json({ error: "Database error" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("POST user-data error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
