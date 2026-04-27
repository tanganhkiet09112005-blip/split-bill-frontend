"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ─── LOGIC ĐĂNG NHẬP THỰC TẾ ──────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Gọi API tới Backend Java
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      // 2. TÍCH HỢP LOGIC: Khi Backend báo Đăng nhập thành công
      if (res.ok) {
        const data = await res.json();
        
        // Lưu "thẻ bài" vào túi của trình duyệt với tên là user_session
        localStorage.setItem("user_session", JSON.stringify(data));
        
        toast.success("Đăng nhập thành công!");
        
        // Chờ 0.8 giây để hiện thông báo rồi mới nhảy trang
        setTimeout(() => {
          window.location.href = "/"; // Đá sang trang chủ
        }, 800);
      } else {
        // Nếu sai mật khẩu hoặc email
        setError("Email hoặc mật khẩu không chính xác!");
      }
    } catch (err) {
      // Nếu Server chưa bật hoặc sai link API
      setError("Không thể kết nối tới Server. Sếp kiểm tra lại Render nhé!");
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setError("Google authentication failed at Server."); 
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 ${sans.className}`}>
      <Toaster position="top-center" />
      
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px] border border-slate-100">
        
        {/* NỬA TRÁI: Form Đăng nhập */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center relative">
          <div className="mb-10">
            <h1 className="text-2xl font-black text-indigo-700 tracking-tighter">PAYSHARE</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Smart Group Spending</p>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">Welcome back</h2>

          {/* Hiển thị lỗi đỏ chuẩn ảnh mẫu */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mb-4 transition-all">
               <p className="text-xs text-rose-500 font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="relative group">
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all"
                required
              />
            </div>

            <div className="relative group">
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Login"}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-100"></div>
            <span className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Hoặc</span>
            <div className="flex-1 border-t border-slate-100"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Đăng nhập bằng Google
          </button>

          <p className="text-center text-sm font-semibold text-slate-400 mt-8">
            Chưa có tài khoản?<p className="text-center text-sm font-semibold text-slate-400 mt-8">
  Chưa có tài khoản? <span onClick={() => window.location.href='/signup'} className="text-indigo-600 hover:underline cursor-pointer">Sign up ngay</span>
</p>
          </p>
        </div>

        {/* NỬA PHẢI: Branding Blue (Indigo) */}
        <div className="hidden md:flex md:w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_white_0%,_transparent_70%)]"></div>
          <div className="relative z-10">
            <h3 className="text-indigo-200 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Smart Splitting</h3>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tighter">
              Effortless <br/> Shared <br/> Finances.
            </h2>
            <div className="mt-8 w-12 h-1.5 bg-white/30 mx-auto rounded-full"></div>
          </div>
        </div>

      </div>
    </div>
  );
}