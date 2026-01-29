"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Tawk_API?: {
      toggle?: () => void;
      maximize?: () => void;
      minimize?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      onLoad?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

interface LiveChatProps {
  propertyId?: string;
  widgetId?: string;
}

const LiveChat = ({
  propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID,
  widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || "default",
}: LiveChatProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Don't load if no property ID or already loaded
    if (!propertyId || isLoaded) {
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      `script[src*="embed.tawk.to"]`
    );
    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Create and append script after delay to prioritize core content loading
    const timer = setTimeout(() => {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
      script.charset = "UTF-8";
      script.setAttribute("crossorigin", "*");

      script.onload = () => {
        setIsLoaded(true);
      };

      script.onerror = () => {
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to load Tawk.to chat widget");
        }
      };

      document.head.appendChild(script);
    }, 4000); // Delay 4 seconds to prioritize core content

    return () => {
      clearTimeout(timer);
    };
  }, [propertyId, widgetId, isLoaded]);

  return null;
};

export default LiveChat;

// Export utility functions for controlling the chat widget
export const openChat = () => {
  if (typeof window !== "undefined" && window.Tawk_API?.maximize) {
    window.Tawk_API.maximize();
  }
};

export const closeChat = () => {
  if (typeof window !== "undefined" && window.Tawk_API?.minimize) {
    window.Tawk_API.minimize();
  }
};

export const toggleChat = () => {
  if (typeof window !== "undefined" && window.Tawk_API?.toggle) {
    window.Tawk_API.toggle();
  }
};

export const hideChat = () => {
  if (typeof window !== "undefined" && window.Tawk_API?.hideWidget) {
    window.Tawk_API.hideWidget();
  }
};

export const showChat = () => {
  if (typeof window !== "undefined" && window.Tawk_API?.showWidget) {
    window.Tawk_API.showWidget();
  }
};
