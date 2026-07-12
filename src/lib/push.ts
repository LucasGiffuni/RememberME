import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

webpush.setVapidDetails(
  "mailto:rememberme@app.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export { webpush };
export { VAPID_PUBLIC_KEY };
