import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import GoogleAuthProvider from "@/components/GoogleAuthProvider"; // Anh em mình sẽ tạo file này

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PAYSHARE - Smart Group Spending",
  description: "Ứng dụng quản lý chi tiêu nhóm của Sếp Kiệt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* 1. Bọc toàn bộ App bằng Google Provider */}
        <GoogleAuthProvider>
          {children}
          <Toaster position="top-center" />
        </GoogleAuthProvider>
      </body>
    </html>
  );
}