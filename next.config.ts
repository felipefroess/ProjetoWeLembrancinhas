import type { NextConfig } from "next";

const nextConfig = (phase: string): NextConfig => {
  process.env.NEXT_PHASE = phase;
  return {
    cacheComponents: true,
    partialPrefetching: true,
  };
};

export default nextConfig;
