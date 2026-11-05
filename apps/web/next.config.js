/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  transpilePackages: ["@repo/ui"],
  async rewrites() {
    return [
      // better-auth lives in the backend, but is served from the web origin so
      // the session cookie and the OAuth redirect URIs belong to one domain.
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:3001/api/auth/:path*",
      },
      {
        source: "/backend/:path*",
        destination: "http://localhost:3001/:path*",
      },
    ];
  },
};

export default nextConfig;
