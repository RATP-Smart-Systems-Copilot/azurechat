/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@azure/storage-blob",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // default is "1mb" 
    },
  },
};

module.exports = nextConfig;
