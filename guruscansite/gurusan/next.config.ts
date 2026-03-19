import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev access from the public IP + localhost.
  // This prevents Next from refusing requests with:
  // “explicitly configure allowedDevOrigins”.
  allowedDevOrigins: [
    // Next expects "origins"; in practice this check is picky across versions.
    // So we include BOTH bare hosts and full scheme origins.
    "localhost",
    "127.0.0.1",
    "187.77.26.215",
    "srv1370724",

    // Broad allow: origin without port covers any port in Next's dev-origin checks.
    "http://localhost",
    "http://127.0.0.1",
    "http://187.77.26.215",

    // Keep explicit ports too (harmless, helps if Next behavior changes)
    "http://localhost:3000",
    "http://187.77.26.215:3000",
    "http://187.77.26.215:3074",
    "http://187.77.26.215:3075",
    "http://187.77.26.215:3076",
    "http://187.77.26.215:3077",
    "http://187.77.26.215:3078",
    "http://187.77.26.215:3079",
    "http://187.77.26.215:3080",
    "http://187.77.26.215:3081",
    "http://187.77.26.215:3082",

    // Recent dev ports
    "187.77.26.215:3111",
    "http://187.77.26.215:3083",
    "http://187.77.26.215:3084",
    "http://187.77.26.215:3100",
    "http://187.77.26.215:3101",
    "http://187.77.26.215:3102",
    "http://187.77.26.215:3103",
    "http://187.77.26.215:3104",
    "http://187.77.26.215:3105",
    "http://187.77.26.215:3106",
    "http://187.77.26.215:3107",
    "http://187.77.26.215:3108",
    "http://187.77.26.215:3109",
    "http://187.77.26.215:3110",
    "http://187.77.26.215:3111",
    "http://187.77.26.215:3112",
    "http://187.77.26.215:3010",

    // If you hit CORS blocks in some mobile browsers that upgrade to https
    "https://187.77.26.215",
    "https://187.77.26.215:3010",
  ],
};

export default nextConfig;
