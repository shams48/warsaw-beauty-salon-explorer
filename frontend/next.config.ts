import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder, otherwise Turbopack walks up to
  // C:\Users\Aykhan (a stray package-lock.json lives there) and tries to scan
  // the whole home directory, which makes the first compile hang.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
