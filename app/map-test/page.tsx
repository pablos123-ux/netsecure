export const dynamic = "force-static";

import GoogleMap from "@/components/GoogleMap";

export default function MapTestPage() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Google Map Test</h1>
      <p className="text-muted-foreground">
        This page loads the Google Maps JavaScript API using your
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and renders a basic map with a marker.
      </p>
      <GoogleMap height={420} width="100%" />
    </div>
  );
}
