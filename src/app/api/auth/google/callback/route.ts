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
    redirect("/?error=google-no-code");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Google token exchange failed:", await tokenResponse.text());
      redirect("/?error=google-auth-failed");
    }

    const tokens = await tokenResponse.json();

    // Save tokens to Supabase
    await supabase
      .from("user_integrations")
      .upsert({
        user_id: userId,
        provider: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,provider" });

    redirect("/?connected=google");
  } catch (error) {
    console.error("Google OAuth error:", error);
    redirect("/?error=google-auth-error");
  }
}
