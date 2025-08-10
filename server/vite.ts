import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(process.cwd(), "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Fix for Railway production: use process.cwd() for all paths
  let distPath = path.resolve(process.cwd(), "dist", "public");

  // Alternative locations to check
  const alternativePaths = [
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "build"),
    path.resolve(process.cwd(), "client", "dist"),
  ];

  if (!fs.existsSync(distPath)) {
    for (const altPath of alternativePaths) {
      if (fs.existsSync(altPath)) {
        distPath = altPath;
        break;
      }
    }
  }

  console.log("🔍 Static file serving debug:");
  console.log("  - Working directory:", process.cwd());
  console.log("  - Looking for static files in:", distPath);
  console.log("  - Directory exists:", fs.existsSync(distPath));

  if (fs.existsSync(distPath)) {
    console.log("  - Files in dist/public:", fs.readdirSync(distPath));
    const assetsPath = path.join(distPath, "assets");
    if (fs.existsSync(assetsPath)) {
      console.log("  - Files in dist/public/assets:", fs.readdirSync(assetsPath));
    }
  }

  if (!fs.existsSync(distPath)) {
    console.error(`❌ Could not find the build directory: ${distPath}`);
    console.error("Available directories:", fs.readdirSync(process.cwd()));
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
