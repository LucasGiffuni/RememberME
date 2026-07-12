import { NextRequest } from "next/server";
import { webpush } from "@/lib/push";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // Get all users with push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error || !subscriptions) {
      return Response.json({ error: "No subscriptions" }, { status: 500 });
    }

    // Get user data and check for reminders
    const { data: userData } = await supabase
      .from("user_data")
      .select("*");

    let notificationsSent = 0;

    for (const sub of subscriptions) {
      const user = userData?.find((u) => u.user_id === sub.user_id);
      if (!user) continue;

      const tasks = JSON.parse(user.tasks || "[]");
      const agenda = JSON.parse(user.agenda || "[]");
      const events = JSON.parse(user.events || "[]");

      const notifications: string[] = [];

      // Check agenda items for current time
      for (const item of agenda) {
        if (!item.completed && item.time === currentTime) {
          notifications.push(item.title);
        }
      }

      // Check events for today
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      for (const event of events) {
        if (event.date === todayStr && event.startTime === currentTime) {
          notifications.push(`Evento: ${event.title}`);
        }
      }

      // Check tasks with reminders
      for (const task of tasks) {
        if (!task.completed && task.reminder) {
          const reminderDate = new Date(task.reminder);
          const diffMs = Math.abs(now.getTime() - reminderDate.getTime());
          if (diffMs < 60000) {
            notifications.push(task.title);
          }
        }
      }

      // Morning summary at 8:00
      if (currentTime === "08:00") {
        const pendingTasks = tasks.filter((t: { completed: boolean }) => !t.completed).length;
        const todayEvents = events.filter((e: { date: string }) => e.date === todayStr).length;
        if (pendingTasks > 0 || todayEvents > 0) {
          notifications.push(`Buenos dias! Tienes ${pendingTasks} tareas y ${todayEvents} eventos hoy`);
        }
      }

      // Send notifications
      if (notifications.length > 0) {
        try {
          const subscription = JSON.parse(sub.subscription);
          await webpush.sendNotification(
            subscription,
            JSON.stringify({
              title: "RememberME",
              body: notifications.join(" | "),
              icon: "/icons/icon-192x192.svg",
              url: "/",
            })
          );
          notificationsSent++;
        } catch (pushError) {
          console.error("Push failed for user:", sub.user_id, pushError);
        }
      }
    }

    return Response.json({ success: true, notificationsSent });
  } catch (error) {
    console.error("Cron error:", error);
    return Response.json({ error: "Cron failed" }, { status: 500 });
  }
}
