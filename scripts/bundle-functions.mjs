// Bundles each Edge Function (+ its _shared imports) into a single ESM file.
// Why: we deploy through Composio's SUPABASE_DEPLOY_FUNCTION, which accepts one source file.
// npm:/jsr:/https: imports stay external and are resolved by the Deno runtime at deploy time.
import { build } from "esbuild";
import { readdirSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../supabase/functions/", import.meta.url));
const out = fileURLToPath(new URL("../.bundles/", import.meta.url));
mkdirSync(out, { recursive: true });

const only = process.argv[2];
const fns = readdirSync(root).filter((d) => !d.startsWith("_") && existsSync(`${root}${d}/index.ts`));

for (const fn of fns.filter((f) => !only || f === only)) {
  await build({
    entryPoints: [`${root}${fn}/index.ts`],
    outfile: `${out}${fn}.js`,
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    external: ["npm:*", "jsr:*", "https:*", "node:*"],
    charset: "utf8",
    legalComments: "none",
  });
  console.log("bundled", fn);
}
