import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const clientBuildDir = path.join(rootDir, ".wasp", "out", "web-app", "build");
// Build Output Specification v1 (cf 1.0.0-rc and later reject the old v0 directory).
const outputRoot = path.join(rootDir, ".cloudflare", "output", "v1");
const defaultWorkerDir = path.join(outputRoot, "workers", "default");
const assetsDir = path.join(defaultWorkerDir, "assets");

const workerName =
  process.env.CLOUDFLARE_PREVIEW_WORKER?.trim() || "fayaa-studio-preview";

try {
  await fs.access(clientBuildDir);
} catch {
  console.error(
    `Missing Wasp Vite client build at ${clientBuildDir}. Run \`wasp compile && npx vite build\` first.`
  );
  process.exit(1);
}

await fs.rm(path.join(rootDir, ".cloudflare", "output"), {
  recursive: true,
  force: true,
});
await fs.mkdir(assetsDir, { recursive: true });

await fs.writeFile(
  path.join(outputRoot, "config.json"),
  JSON.stringify(
    {
      buildContext: {
        isPreview: process.env.CLOUDFLARE_PREVIEW_BUILD !== "false",
      },
    },
    null,
    2
  )
);

await fs.writeFile(
  path.join(defaultWorkerDir, "worker.config.json"),
  JSON.stringify(
    {
      name: workerName,
      compatibilityDate: "2026-11-01",
      assets: {
        htmlHandling: "auto-trailing-slash",
        notFoundHandling: "single-page-application",
      },
    },
    null,
    2
  )
);

await fs.cp(clientBuildDir, assetsDir, { recursive: true });
console.log(
  `Prepared Cloudflare Workers Static Assets output at ${defaultWorkerDir} (worker=${workerName})`
);
