"use client";

import Script from "next/script";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

const AdSense = () => {
  if (!ADSENSE_CLIENT_ID) {
    return null;
  }

  return (
    <Script
      strategy="lazyOnload"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  );
};

export default AdSense;
