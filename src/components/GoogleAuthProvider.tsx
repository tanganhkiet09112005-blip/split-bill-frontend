"use client"; // Bắt buộc phải có dòng này ở đầu file

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  // Thay mã Client ID của Sếp vào đây
  const clientId = "zevo jluv otwz borm";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}