import type {
  NextConfig,
} from "next";

const backendApiUrl =
  process.env.BACKEND_API_URL ??
  "http://localhost:5050";

const nextConfig:
  NextConfig = {
    reactStrictMode: true,

    devIndicators: false,

    async rewrites() {
      return [
        {
          source:
            "/backend/:path*",

          destination:
            `${backendApiUrl}/api/v1/:path*`,
        },
      ];
    },
  };

export default nextConfig;
