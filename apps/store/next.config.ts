import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@unstucklabs/ui", "@unstucklabs/sdk"],
};

export default nextConfig;
