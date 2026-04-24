import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phải là 0.103 - IP Wifi thật của bạn
  allowedDevOrigins: ['192.168.0.103', 'localhost:3000'],
};

export default nextConfig;