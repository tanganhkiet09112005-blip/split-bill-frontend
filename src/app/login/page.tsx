"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { Loader2 } from "lucide-react";

const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Tạm thời hiển thị lỗi giống trong ảnh để Sếp test UI
    setTimeout(() => {
      setIsLoading(false);
      setError("Tính năng đang kết nối Backend. Vui lòng thử lại sau.");
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError("Google authentication failed at Server."); // Lỗi y hệt ảnh Sếp gửi =))
    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 ${sans.className}`}>
      {/* Khối chứa toàn bộ giao diện Login */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden min-h-[550px]">
        
        {/* NỬA TRÁI: Form Đăng nhập */}
        <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center relative">
          <div className="mb-10">
            <h1 className="text-2xl font-extrabold text-indigo-700 tracking-tight">PAYSHARE</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Smart Group Spending</p>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-6">Welcome back</h2>

          {/* Hiển thị lỗi (giống trong ảnh mẫu) */}
          {error && <p className="text-sm text-rose-500 mb-4 font-medium">{error}</p>}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <div className="relative flex items-center">
                <svg className="w-5 h-5 text-slate-400 absolute left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <input 
                  type="email" 
                  placeholder="Email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all placeholder:font-normal"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative flex items-center">
                <svg className="w-5 h-5 text-slate-400 absolute left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all placeholder:font-normal"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Login"}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-4 text-xs font-semibold text-slate-400 uppercase">OR</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-3"
          >
            {/* Logo Google SVG */}
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.419 L -8.284 53.419 C -8.554 54.819 -9.414 55.939 -10.534 56.699 L -10.534 59.419 L -6.684 59.419 C -4.434 57.329 -3.264 54.669 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.419 L -10.534 57.699 C -11.614 58.439 -13.044 58.839 -14.754 58.839 C -18.064 58.839 -20.844 56.599 -21.864 53.599 L -25.824 53.599 L -25.824 56.669 C -23.824 60.629 -19.644 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.864 53.599 C -22.124 52.819 -22.274 51.989 -22.274 51.139 C -22.274 50.289 -22.124 49.459 -21.864 48.679 L -21.864 45.609 L -25.824 45.609 C -26.654 47.259 -27.114 49.139 -27.114 51.139 C -27.114 53.139 -26.654 55.019 -25.824 56.669 L -21.864 53.599 Z"/>
                <path fill="#EA4335" d="M -14.754 43.439 C -12.984 43.439 -11.404 44.049 -10.154 45.239 L -6.744 41.829 C -8.804 39.909 -11.514 38.739 -14.754 38.739 C -19.644 38.739 -23.824 41.349 -25.824 45.609 L -21.864 48.679 C -20.844 45.679 -18.064 43.439 -14.754 43.439 Z"/>
              </g>
            </svg>
            Đăng nhập bằng Google
          </button>

          <p className="text-center text-sm font-medium text-slate-500 mt-8">
            Chưa có tài khoản? <a href="#" className="text-indigo-600 hover:text-indigo-700 transition-colors">Sign up</a>
          </p>
        </div>

        {/* NỬA PHẢI: Branding Blue (Chỉ hiện trên màn hình to) */}
        <div className="hidden md:flex md:w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 text-center relative overflow-hidden">
          {/* Hiệu ứng mờ ảo phía sau nền */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <div className="relative z-10">
            <h3 className="text-indigo-200 text-xs font-bold tracking-[0.2em] uppercase mb-4">Smart Splitting</h3>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Effortless <br/> Shared Finances.
            </h2>
          </div>
        </div>

      </div>
    </div>
  );
}