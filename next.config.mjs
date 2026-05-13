const backendBaseUrl = (process.env.BACKEND_INTERNAL_URL ?? "").trim().replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    if (!backendBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendBaseUrl}/api/:path*`,
      },
      {
        source: "/workers/api/:path*",
        destination: `${backendBaseUrl}/workers/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
