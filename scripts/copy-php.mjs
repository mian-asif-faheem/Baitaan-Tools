// Copies the shared PHP endpoints into every site's build output, so all four sites run the
// same code. Runs after `astro build` (see package.json "build").
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [["scripts/subscribe.php", "api/subscribe.php"]];

for (const site of ["root", "es", "pt", "ar"]) {
  const dist = join(root, "sites", site, "dist");
  if (!existsSync(dist)) continue;
  for (const [from, to] of files) {
    mkdirSync(dirname(join(dist, to)), { recursive: true });
    copyFileSync(join(root, from), join(dist, to));
  }
  console.log(`copied PHP endpoints to sites/${site}/dist`);
}
