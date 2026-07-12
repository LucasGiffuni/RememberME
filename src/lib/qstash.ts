import { Client } from "@upstash/qstash";

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN || "",
  baseUrl: "https://qstash.upstash.io",
});

export { qstashClient };

/**
 * Schedule a push notification to be sent at a specific time.
 * @param userId - The Clerk user ID
 * @param title - Notification title
 * @param body - Notification body
 * @param scheduledAt - Date when the notification should be sent
 */
export async function scheduleReminder(
  userId: string,
  title: string,
  body: string,
  scheduledAt: Date
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const targetUrl = `${baseUrl}/api/push/send`;

  // Calculate delay in seconds
  const now = new Date();
  const delaySeconds = Math.max(0, Math.floor((scheduledAt.getTime() - now.getTime()) / 1000));

  if (delaySeconds <= 0) {
    // If the time has already passed, send immediately
    await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CRON_SECRET || "dev-secret"}`,
      },
      body: JSON.stringify({ userId, title, body }),
    });
    return;
  }

  await qstashClient.publishJSON({
    url: targetUrl,
    body: { userId, title, body },
    headers: {
      "Authorization": `Bearer ${process.env.CRON_SECRET || "dev-secret"}`,
    },
    delay: delaySeconds,
  });
}
