/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { useWasmBinary: process.platform === "win32" },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
