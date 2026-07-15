export type ConnectionState = "idle" | "connecting" | "ready" | "needs-auth" | "failed" | "closed";

export const canTransition = (from: ConnectionState, to: ConnectionState) =>
  from === "idle" ? to === "connecting" || to === "closed" :
  from === "connecting" ? to === "ready" || to === "needs-auth" || to === "failed" :
  from === "needs-auth" ? to === "connecting" || to === "failed" || to === "closed" :
  from === "ready" ? to === "needs-auth" || to === "failed" || to === "closed" :
  from === "failed" ? to === "connecting" || to === "closed" : false;
