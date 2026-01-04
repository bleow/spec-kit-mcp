import fs from "fs";

export function loadEnv(path: string) {
  const processLocal: { [key: string]: string } = {};

  const content = fs.readFileSync(path, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();

    process.env[key] = value;
    processLocal[key] = value;
  }

  return processLocal;
}
