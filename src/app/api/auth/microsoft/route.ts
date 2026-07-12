import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  
  if (!clientId) {
    return Response.json({ error: "Outlook not configured. Add MICROSOFT_CLIENT_ID to environment variables." }, { status: 501 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`;
  const scope = encodeURIComponent("Calendars.Read offline_access");
  const state = "microsoft-calendar-connect";

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

  redirect(authUrl);
}
