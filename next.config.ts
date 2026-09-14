import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* PWA via manual service worker in /public/sw.js — registered client-side */
  reactStrictMode: true,
};

export default nextConfig;