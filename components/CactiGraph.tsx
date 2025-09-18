"use client";

import React from "react";

type CactiGraphProps = {
  graphId: number | string;
  title?: string;
};

/**
 * Embeds a Cacti graph in an iframe.
 * Configure the base URL with NEXT_PUBLIC_CACTI_BASE_URL (e.g., http://<cacti-server>).
 */
const CactiGraph: React.FC<CactiGraphProps> = ({ graphId, title }) => {
  const baseUrl = React.useMemo(() => {
    return process.env.NEXT_PUBLIC_CACTI_BASE_URL?.replace(/\/$/, "");
  }, []);

  const id = React.useMemo(() => String(graphId), [graphId]);

  const src = React.useMemo(() => {
    return baseUrl
      ? `${baseUrl}/graph_view.php?action=preview&graph_id=${encodeURIComponent(id)}`
      : `about:blank`;
  }, [baseUrl, id]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="border rounded-lg shadow-sm bg-background">
        {title ? (
          <div className="px-4 pt-4">
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          </div>
        ) : null}
        <div className="p-4">
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            {/* 16:9 responsive iframe */}
            <iframe
              title={title ?? `Cacti Graph ${id}`}
              src={src}
              loading="lazy"
              className="absolute inset-0 h-full w-full rounded-md border"
              referrerPolicy="no-referrer"
            />
          </div>
          {!baseUrl ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Set <code className="font-mono">NEXT_PUBLIC_CACTI_BASE_URL</code> to your Cacti server URL to load graphs.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CactiGraph);
