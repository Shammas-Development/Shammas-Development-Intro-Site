"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    TrustpilotObject?: string;
    tp?: {
      (action: string, ...args: unknown[]): void;
      q?: unknown[];
    };
  }
}

interface TrustpilotProps {
  businessId?: string;
}

const Trustpilot = ({
  businessId = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_ID,
}: TrustpilotProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!businessId || isLoaded) {
      return;
    }

    // Check if already loaded
    const existingScript = document.querySelector(
      `script[src*="invitejs.trustpilot.com"]`
    );
    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    // Delay loading until after page is interactive
    const timer = setTimeout(() => {
      // Initialize Trustpilot API
      window.TrustpilotObject = "tp";
      window.tp =
        window.tp ||
        function (...args: unknown[]) {
          (window.tp!.q = window.tp!.q || []).push(args);
        };

      // Create and load script
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://invitejs.trustpilot.com/tp.min.js";
      script.type = "text/javascript";

      script.onload = () => {
        if (window.tp) {
          window.tp("register", businessId);
        }
        setIsLoaded(true);
      };

      document.head.appendChild(script);
    }, 3000); // Load after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [businessId, isLoaded]);

  return null;
};

export default Trustpilot;
