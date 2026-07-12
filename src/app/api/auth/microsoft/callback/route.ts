import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    redirect("/?error=microsoft-no-code");
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID || "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || "";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`;

  try {
    const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "Calendars.Read offline_access",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Microsoft token exchange failed:", await tokenResponse.text());
      redirect("/?error=microsoft-auth-failed");
    }

    const tokens = await tokenResponse.json();

    await supabase
      .from("user_integrations")
      .upsert({
        user_id: userId,
        provider: "microsoft",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,provider" });

    redirect("/?connected=microsoft");
  } catch (error) {
    console.error("Microsoft OAuth error:", error);
    redirect("/?error=microsoft-auth-error");
  }
}
