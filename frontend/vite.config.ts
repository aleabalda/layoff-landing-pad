import { existsSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

// In development, serves the Vercel functions in api/ (for example
// api/personalize-plan.ts at /api/personalize-plan) so `npm run dev` works
// without the Vercel CLI. In production Vercel runs them itself.
function apiRoutes(): Plugin {
  return {
    name: "dev-api-routes",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        const name = url.match(/^\/api\/([\w-]+)(?:[?#]|$)/)?.[1];
        // Like Vercel, names starting with "_" (such as api/_lib) aren't routes.
        if (!name || name.startsWith("_")) return next();

        const file = path.join(server.config.root, "api", `${name}.ts`);
        if (!existsSync(file)) return next();

        try {
          const route = await server.ssrLoadModule(file);
          const handler = route[req.method ?? "GET"];
          if (typeof handler !== "function") {
            res.statusCode = 405;
            res.end("Method not allowed");
            return;
          }

          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value !== undefined) {
              headers.set(key, Array.isArray(value) ? value.join(", ") : value);
            }
          }
          const hasBody = req.method !== "GET" && req.method !== "HEAD";

          const response: Response = await handler(
            new Request(new URL(url, "http://localhost"), {
              method: req.method,
              headers,
              body: hasBody ? Buffer.concat(chunks) : undefined,
            }),
          );

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.config.logger.error(`api/${name}.ts failed: ${String(err)}`);
          res.statusCode = 500;
          res.end("API error");
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Lets the dev API routes read secrets like GEMINI_API_KEY from .env.
  // Only VITE_ variables ever reach the browser.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ""))) {
    process.env[key] ??= value;
  }

  return {
    plugins: [react(), tailwindcss(), apiRoutes()],
  };
});
