"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google"; // Thư viện Google OAuth

const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Ưu tiên lấy link từ .env, không thì dùng link Render của Sếp
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://split-bill-backend-5srl.onrender.com/api";

  // --- 1. XỬ LÝ ĐĂNG NHẬP THÔNG THƯỜNG (EMAIL/PASS) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem("user_session", JSON.stringify(userData));
        toast.success(`Chào mừng ${userData.fullName} trở lại!`);
        setTimeout(() => {
          window.location.href = "/"; 
        }, 1000);
      } else {
        setError("Email hoặc mật khẩu không đúng!");
      }
    } catch (err) {
      setError("Không thể kết nối Server Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. XỬ LÝ ĐĂNG NHẬP GOOGLE (HÀNG THẬT) ---
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        // Gửi access_token mà Google trả về sang Java Backend
        const res = await fetch(`${API_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token })
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("user_session", JSON.stringify(data));
          toast.success("Đăng nhập Google thành công!");
          setTimeout(() => {
            window.location.href = "/"; 
          }, 1000);
        } else {
          toast.error("Lỗi xác thực tại Server Backend!");
        }
      } catch (err) {
        toast.error("Lỗi kết nối khi đăng nhập Google!");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error("Đăng nhập Google thất bại!"),
  });

  return (
    <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 ${sans.className}`}>
      <Toaster position="top-center" />
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px] border border-slate-100">
        
        {/* CỘT BÊN TRÁI (FORM) */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight mb-1">PAYSHARE</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Smart Group Spending</p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-sm font-medium text-slate-500">Đăng nhập để xem các khoản nợ của bạn.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mb-4 text-center">
               <p className="text-xs text-rose-500 font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative group">
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all" required />
            </div>

            <div className="relative group">
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all" required />
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Login"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoặc</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* NÚT GOOGLE CỦA SẾP GIỜ ĐÃ CHẠY ĐƯỢC THẬT */}
          <button 
            type="button"
            onClick={() => loginWithGoogle()} 
            disabled={isLoading}
            className="w-full h-12 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Đăng nhập bằng Google
              </>
            )}
          </button>

          <p className="text-center text-sm font-semibold text-slate-400 mt-8">
            Chưa có tài khoản? <span onClick={() => window.location.href='/signup'} className="text-indigo-600 hover:underline cursor-pointer">Sign up ngay</span>
          </p>
        </div>

        {/* CỘT BÊN PHẢI (IMAGE/TEXT) */}
        <div className="hidden md:flex md:w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_white_0%,_transparent_70%)]"></div>
          <div className="relative z-10">
            <h3 className="text-indigo-200 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Smart Splitting</h3>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tighter">
              Effortless <br/> Shared <br/> Finances.
            </h2>
            <div className="w-12 h-1.5 bg-indigo-400/50 rounded-full mx-auto mt-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
}