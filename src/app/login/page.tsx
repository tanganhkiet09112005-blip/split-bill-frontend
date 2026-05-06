"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

// ⚠️ SẾP THAY CLIENT ID CỦA SẾP VÀO ĐÂY NHÉ (Hoặc dùng file .env)
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "608236410703-gqrg1eukkfceoaa9gnklgfu1s87l40oc.apps.googleusercontent.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://split-bill-backend-5srl.onrender.com/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 🚀 LOGIC ĐĂNG NHẬP GOOGLE SẾP YÊU CẦU
  const handleGoogleLogin = async (credentialResponse: any) => {
    const googleToken = credentialResponse.credential;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleToken }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        toast.success(`Chào mừng ${data.fullName} đến với PAYSHARE!`);
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setError(data.message || "Đăng nhập Google thất bại từ Server!");
      }
    } catch (err) {
      setError("Không thể kết nối Backend. Nhớ bật Server nhé Sếp!");
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 LOGIC ĐĂNG NHẬP TRUYỀN THỐNG (BẰNG TÀI KHOẢN/MẬT KHẨU)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        toast.success("Đăng nhập thành công!");
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setError("Email hoặc mật khẩu không chính xác!");
      }
    } catch (err) {
      setError("Không thể kết nối Server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 ${sans.className}`}>
        <Toaster position="top-center" />
        <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px] border border-slate-100">
          
          <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center relative">
            <button onClick={() => router.push('/')} className="absolute top-8 left-8 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 text-sm font-medium">
              <ArrowLeft size={16} /> Trang chủ
            </button>

            <div className="mt-6 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Đăng nhập</h2>
              <p className="text-sm font-medium text-slate-500">Mừng bạn quay trở lại PAYSHARE.</p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mb-4">
                <p className="text-xs text-rose-500 font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
              <div className="relative group">
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all" required />
              </div>

              <div className="relative group">
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all" required />
              </div>

              <button type="submit" disabled={isLoading} className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hoặc</span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            {/* NÚT GOOGLE THẦN THÁNH */}
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError("Cửa sổ đăng nhập Google bị đóng hoặc có lỗi xảy ra.")}
                useOneTap
                theme="outline"
                size="large"
                shape="rectangular"
                width="100%"
              />
            </div>

            <p className="text-center text-sm font-medium text-slate-500 mt-6">
              Chưa có tài khoản? <button onClick={() => router.push('/signup')} className="text-indigo-600 font-bold hover:underline">Đăng ký ngay</button>
            </p>
          </div>

          <div className="hidden md:flex md:w-1/2 bg-slate-900 flex-col items-center justify-center p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,_#4f46e5_0%,_transparent_70%)]"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
                <span className="text-white font-black text-2xl">P</span>
              </div>
              <h2 className="text-3xl font-black text-white leading-tight mb-4">
                Quản lý chi tiêu<br/>chưa bao giờ dễ đến thế
              </h2>
              <p className="text-slate-400 font-medium text-sm px-4">
                Đăng nhập bằng Google chỉ với 1 chạm để truy cập không gian làm việc của Sếp ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}