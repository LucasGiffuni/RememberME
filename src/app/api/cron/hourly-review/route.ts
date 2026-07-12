import { NextRequest } from "next/server";
import { webpush } from "@/lib/push";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function generateSmartMessage(tasks: { title: string; completed: boolean }[]): Promise<string> {
  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  
  if (pending.length === 0) return "";

  if (!GEMINI_API_KEY) {
    // Fallback without AI
    const taskList = pending.map(t => t.title).join(", ");
    return `Tienes ${pending.length} tarea(s) pendiente(s): ${taskList}`;
  }

  try {
    const prompt = `Eres un asistente personal amigable. El usuario tiene estas tareas:
- Completadas: ${completed.map(t => t.title).join(", ") || "ninguna"}
- Pendientes: ${pending.map(t => t.title).join(", ")}

Genera un mensaje CORTO (máximo 2 líneas) motivacional y claro recordándole las tareas pendientes. 
Sé directo, usa español informal. No uses emojis. Incluye la lista de pendientes.
Solo devuelve el mensaje, nada más.`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 100 },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    }
  } catch (e) {
    console.error("Gemini error in hourly review:", e);
  }

  // Fallback
  const taskList = pending.map(t => t.title).join(", ");
  return `Tienes ${pending.length} pendiente(s): ${taskList}`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (QStash or cron secret)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret";
    const isUpstash = request.headers.get("upstash-signature");
    
    if (!isUpstash && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Get current hour to check if we should notify (9am - 22pm local)
    const now = new Date();
    const hour = now.getHours(); // UTC
    // We'll send for all users and let them have their own timezone later
    
    // Get all users with data
    const { data: users, error: usersError } = await supabase
      .from("user_data")
      .select("user_id, tasks");

    if (usersError || !users) {
      return Response.json({ error: "No users found" }, { status: 500 });
    }

    let notificationsSent = 0;

    for (const user of users) {
      const tasks = JSON.parse(user.tasks || "[]");
      const pendingTasks = tasks.filter((t: { completed: boolean }) => !t.completed);
      
      if (pendingTasks.length === 0) continue;

      // Generate smart message with AI
      const message = await generateSmartMessage(tasks);
      if (!message) continue;

      // Get push subscription
      const { data: sub } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", user.user_id)
        .single();

      if (!sub) continue;

      try {
        const subscription = JSON.parse(sub.subscription);
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: `RememberME - ${pendingTasks.length} pendiente(s)`,
            body: message,
            icon: "/icons/icon-192x192.svg",
            url: "/",
          })
        );
        notificationsSent++;
      } catch (pushError) {
        console.error("Push failed for user:", user.user_id, pushError);
      }
    }

    return Response.json({ success: true, notificationsSent, hour });
  } catch (error) {
    console.error("Hourly review error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// Also support GET for Vercel cron
export async function GET(request: NextRequest) {
  return POST(request);
}
