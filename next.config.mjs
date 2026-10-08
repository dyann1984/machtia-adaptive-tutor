/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { useWasmBinary: process.platform === "win32" },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.MCP_BACKEND_URL || "https://machtia-tutor-mcp-server.onrender.com";
    return [
      {
        source: "/mcp",
        destination: `${backendUrl}/mcp`,
      },
      {
        source: "/api/demo",
        destination: `${backendUrl}/api/demo`,
      },
      {
        source: "/api/role",
        destination: `${backendUrl}/api/role`,
      },
      {
        source: "/api/state",
        destination: `${backendUrl}/api/state`,
      },
      {
        source: "/api/practices",
        destination: `${backendUrl}/api/practices`,
      },
      {
        source: "/api/support",
        destination: `${backendUrl}/api/support`,
      },
    ];
  },
};

export default nextConfig;
