import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Thêm dòng này để cấp phép cho điện thoại/máy ảo của Sếp
  allowedDevOrigins: ['192.168.56.1', 'localhost'],
};


export default nextConfig;