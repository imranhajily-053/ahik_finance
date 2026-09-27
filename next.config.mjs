/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: { serverComponentsExternalPackages: ["exceljs", "pdfkit"] },
};
export default nextConfig;
