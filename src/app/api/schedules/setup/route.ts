import { NextRequest } from "next/server";
import { Client } from "@upstash/qstash";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "dev-secret";
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const qstash = new Client({ 
      token: process.env.QSTASH_TOKEN || "",
      baseUrl: "https://qstash.upstash.io",
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://remember-me-pink-nine.vercel.app";

    // Create a schedule that runs every hour from 9am to 10pm (UTC-3 = 12 to 01 UTC)
    // Using cron expression: every hour
    const schedule = await qstash.schedules.create({
      destination: `${appUrl}/api/cron/hourly-review`,
      cron: "0 * * * *", // Every hour at minute 0
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "qstash-schedule" }),
    });

    return Response.json({ success: true, scheduleId: schedule.scheduleId });
  } catch (error) {
    console.error("Schedule setup error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
