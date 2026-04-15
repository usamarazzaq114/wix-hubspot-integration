import React from "react";

export function ConnectionStatus({ connected }: { connected: boolean }) {
  return <div>{connected ? "Connected to HubSpot" : "Not connected"}</div>;
}
