"use client";

import React from "react";
import Script from "next/script";

// The API key must be exposed to the client with NEXT_PUBLIC_ prefix
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type GoogleMapProps = {
  height?: number | string; // e.g., 400 or "50vh"
  width?: number | string;  // e.g., "100%"
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  disableUI?: boolean;
};

export default function GoogleMap({
  height = 400,
  width = "100%",
  center = { lat: 37.7749, lng: -122.4194 }, // Default: San Francisco
  zoom = 10,
  disableUI = false,
}: GoogleMapProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const containerStyle: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    width: typeof width === "number" ? `${width}px` : width,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid hsl(var(--border))",
  };

  const scriptSrc = API_KEY
    ? `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`
    : null;

  React.useEffect(() => {
    if (!API_KEY) {
      setError(
        "Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment. Add it to .env.local and restart the dev server."
      );
      return;
    }
  }, []);

  const handleScriptLoad = () => {
    // The script is loaded; ensure google is present and mount the map
    if (!(window as any).google?.maps) {
      setError("Google Maps API failed to load.");
      return;
    }
    if (mapRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        disableDefaultUI: disableUI,
      });
      // Optional: Add a marker at center
      new google.maps.Marker({ position: center, map });
      setIsReady(true);
    }
  };

  return (
    <div className="w-full">
      {scriptSrc ? (
        <Script src={scriptSrc} strategy="afterInteractive" onLoad={handleScriptLoad} />
      ) : null}

      <div style={containerStyle}>
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        {error && <p role="alert">{error}</p>}
        {!error && !isReady && <p>Loading Google Map…</p>}
      </div>
    </div>
  );
}
