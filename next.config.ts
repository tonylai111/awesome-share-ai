import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // Parent ~/package-lock.json otherwise steals Turbopack root and breaks next-intl resolution.
  turbopack: {
    root: projectRoot,
  },
};

export default withNextIntl(nextConfig);
