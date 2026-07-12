import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events: { title: string; start: string; end: string; source: string }[] = [];

  // Get user integrations
  const { data: integrations } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId);

  if (!integrations || integrations.length === 0) {
    return Response.json({ events: [], message: "No calendars connected" });
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

  for (const integration of integrations) {
    try {
      if (integration.provider === "google") {
        // Check if token is expired and refresh if needed
        let accessToken = integration.access_token;
        if (new Date(integration.expires_at) < new Date() && integration.refresh_token) {
          accessToken = await refreshGoogleToken(integration.refresh_token, userId);
        }

        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(todayStart)}&timeMax=${encodeURIComponent(todayEnd)}&singleEvents=true&orderBy=startTime`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        if (res.ok) {
          const data = await res.json();
          for (const item of (data.items || [])) {
            events.push({
              title: item.summary || "Sin título",
              start: item.start?.dateTime || item.start?.date || "",
              end: item.end?.dateTime || item.end?.date || "",
              source: "google",
            });
          }
        }
      }

      if (integration.provider === "microsoft") {
        let accessToken = integration.access_token;
        if (new Date(integration.expires_at) < new Date() && integration.refresh_token) {
          accessToken = await refreshMicrosoftToken(integration.refresh_token, userId);
        }

        const res = await fetch(
          `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${todayStart}&endDateTime=${todayEnd}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        if (res.ok) {
          const data = await res.json();
          for (const item of (data.value || [])) {
            events.push({
              title: item.subject || "Sin título",
              start: item.start?.dateTime || "",
              end: item.end?.dateTime || "",
              source: "microsoft",
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching ${integration.provider} events:`, error);
    }
  }

  return Response.json({ events });
}

async function refreshGoogleToken(refreshToken: string, userId: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  
  // Update token in database
  await supabase
    .from("user_integrations")
    .update({
      access_token: data.access_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "google");

  return data.access_token;
}

async function refreshMicrosoftToken(refreshToken: string, userId: string): Promise<string> {
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.MICROSOFT_CLIENT_ID || "",
      client_secret: process.env.MICROSOFT_CLIENT_SECRET || "",
      grant_type: "refresh_token",
      scope: "Calendars.Read offline_access",
    }),
  });

  const data = await res.json();

  await supabase
    .from("user_integrations")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "microsoft");

  return data.access_token;
}
