import type { Server } from "node:http";
import { validateCiDatabaseEnvironment } from "../scripts/ci-test-database-guard.mjs";

/** Own the API server; never send fixture mutations to a workspace/live app. */
export async function startCiIsolatedApp() {
  validateCiDatabaseEnvironment(process.env);
  const { pool } = await import("../server/db");
  const proof = await pool.query(
    "SELECT marker FROM public.ci_disposable_guard WHERE marker=$1",
    ["github-actions-disposable-only"],
  );
  if (proof.rowCount !== 1) throw new Error("Database disposable CI belum dibuktikan.");
  const { default: express } = await import("express");
  const { createServer } = await import("node:http");
  const { registerRoutes } = await import("../server/routes");
  const app = express();
  app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
  const server: Server = createServer(app);
  try {
    await registerRoutes(server, app);
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Alamat fixture tidak tersedia.");
    return {
      url: `http://127.0.0.1:${address.port}`,
      async close() {
        server.closeAllConnections();
        await new Promise<void>((resolve, reject) =>
          server.close(error => error ? reject(error) : resolve()));
      },
    };
  } catch (error) {
    server.closeAllConnections();
    if (server.listening) await new Promise<void>(resolve => server.close(() => resolve()));
    throw error;
  }
}
