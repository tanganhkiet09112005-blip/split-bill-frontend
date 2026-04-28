"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  // Mã Client ID xịn của Sếp
  const clientId = "608236410703-gqrg1eukkfceoaa9gnklgfu1s87l40oc.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}