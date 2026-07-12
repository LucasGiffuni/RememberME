"use client";

import { useState, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const checkSupport = useCallback(() => {
    const hasServiceWorker = "serviceWorker" in navigator;
    const hasPushManager = "PushManager" in window;
    const hasNotification = "Notification" in window;
    const supported = hasServiceWorker && hasPushManager && hasNotification;
    setIsSupported(supported);
    if (!supported) {
      const missing = [];
      if (!hasServiceWorker) missing.push("ServiceWorker");
      if (!hasPushManager) missing.push("PushManager");
      if (!hasNotification) missing.push("Notification");
      setError(`No soportado: falta ${missing.join(", ")}`);
    }
    return supported;
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    setError(null);
    setStatus("Verificando soporte...");

    if (!checkSupport()) {
      setStatus("");
      return false;
    }

    try {
      setStatus("Pidiendo permiso...");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(`Permiso denegado: ${permission}`);
        setStatus("");
        return false;
      }

      setStatus("Registrando service worker...");
      const registration = await navigator.serviceWorker.ready;

      setStatus("Suscribiendo a push...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setStatus("Guardando en servidor...");
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (response.ok) {
        setIsSubscribed(true);
        setStatus("Notificaciones activadas");
        return true;
      } else {
        const data = await response.json().catch(() => ({}));
        setError(`Error del servidor: ${data.error || response.status}`);
        setStatus("");
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      setStatus("");
      return false;
    }
  }, [checkSupport]);

  return { subscribe, isSubscribed, isSupported, checkSupport, error, status };
}
