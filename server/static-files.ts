import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStaticFiles(app: Express) {
  // Simple, robust static file serving for Railway
  const possiblePaths = [
    "/app/dist/public", // Railway build output
    "/app/public", // Alternative
    path.join(process.cwd(), "dist", "public"), // Local relative
    path.join(process.cwd(), "public"), // Alternative local
  ];

  let staticPath: string | null = null;

  // Find the first path that exists
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      staticPath = testPath;
      console.log(`✅ Found static files at: ${staticPath}`);
      break;
    }
  }

  if (!staticPath) {
    console.error("❌ No static files found. Checked paths:");
    possiblePaths.forEach((p) => console.error(`  - ${p} (exists: ${fs.existsSync(p)})`));

    // Create a minimal fallback
    app.get("*", (req, res) => {
      res.status(500).send(`
        <html>
          <head><title>ZakaMall - Setup Required</title></head>
          <body style="font-family: Arial; padding: 20px;">
            <h1>🚧 ZakaMall Setup in Progress</h1>
            <p>Static files not found. Working directory: ${process.cwd()}</p>
            <p>API is available at: <a href="/api/health">/api/health</a></p>
            <hr>
            <p>Checked paths:</p>
            <ul>
              ${possiblePaths.map((p) => `<li>${p} - ${fs.existsSync(p) ? "✅" : "❌"}</li>`).join("")}
            </ul>
          </body>
        </html>
      `);
    });
    return;
  }

  // Serve static files
  app.use(express.static(staticPath));

  // SPA fallback to index.html for client-side routing
  // This should catch all non-API routes and serve the React app
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    const indexPath = path.join(staticPath!, "index.html");
    if (fs.existsSync(indexPath)) {
      console.log(`Serving index.html for client route: ${req.path}`);
      res.sendFile(indexPath);
    } else {
      console.error(`index.html not found at: ${indexPath}`);
      res.status(404).send(`
        <html>
          <head><title>ZakaMall - File Not Found</title></head>
          <body style="font-family: Arial; padding: 20px;">
            <h1>File Not Found</h1>
            <p>Path: ${req.originalUrl}</p>
            <p>Static directory: ${staticPath}</p>
            <p>Index.html exists: ${fs.existsSync(indexPath)}</p>
          </body>
        </html>
      `);
    }
  });
}
