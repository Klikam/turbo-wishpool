import process from "node:process";

const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  throw new Error("BACKEND_URL is not defined");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  transpilePackages: ["@repo/ui"],
  async rewrites() {
    return [
      // better-auth lives in the backend, but is served from the web origin so
      // the session cookie belongs to that domain.
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
