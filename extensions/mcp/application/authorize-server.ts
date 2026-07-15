import type { McpConnectionPort } from "./ports.js";

const inFlight = new WeakMap<McpConnectionPort, Promise<void>>();

export function authorizeServer(connection: McpConnectionPort, signal: AbortSignal) {
  const pending = inFlight.get(connection);
  if (pending) return pending;
  const authorization = run(connection, signal).finally(() => inFlight.delete(connection));
  inFlight.set(connection, authorization);
  return authorization;
}

async function run(connection: McpConnectionPort, signal: AbortSignal) {
  if (
    !connection.retryConnection ||
    !connection.beginAuthorization ||
    !connection.isAuthorizationError
  )
    throw new Error("Server does not support authorization");
  try {
    await connection.retryConnection();
    return;
  } catch (error) {
    if (!connection.isAuthorizationError(error)) throw safeError(error);
  }
  const attempt = await connection.beginAuthorization(signal);
  const code = attempt.waitForCode(signal);
  try {
    await connection.retryConnection();
  } catch (error) {
    if (!connection.isAuthorizationError(error)) throw safeError(error);
  }
  try {
    await connection.finishAuth?.(await code);
    await connection.retryConnection();
  } catch (error) {
    throw safeError(error);
  } finally {
    await attempt.close();
  }
}

const safeError = (error: unknown) =>
  new Error(error instanceof Error ? "Authorization failed" : "Authorization failed");
