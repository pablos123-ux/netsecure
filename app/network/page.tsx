import React from "react";
import CactiGraph from "@/components/CactiGraph";

export default function NetworkPage() {
	return (
		<div className="space-y-6 p-4">
			<h1 className="text-2xl font-bold tracking-tight">Network Usage</h1>
			<CactiGraph graphId={10} title="WAN Usage - Graph 10" />
			<CactiGraph graphId={11} title="WAN Usage - Graph 11" />
			<CactiGraph graphId={String(12)} title="WAN Usage - Graph 12 (string id)" />
		</div>
	);
}


