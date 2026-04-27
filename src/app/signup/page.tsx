"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import { Loader2, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password })
      });

      if (res.ok) {
        toast.success("Đăng ký thành công! Hãy đăng nhập nhé.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        setError("Email này đã được sử dụng hoặc có lỗi xảy ra!");
      }
    } catch (err) {
      setError("Không thể kết nối Server. Nhớ bật Backend Java lên nhé Sếp!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 ${sans.className}`}>
      <Toaster position="top-center" />
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px] border border-slate-100">
        
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center relative">
          <button onClick={() => window.location.href='/login'} className="absolute top-8 left-8 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 text-sm font-medium">
             <ArrowLeft size={16} /> Quay lại
          </button>

          <div className="mt-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tạo tài khoản mới</h2>
            <p className="text-sm font-medium text-slate-500">Tham gia PAYSHARE để quản lý chi tiêu nhóm dễ dàng hơn.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mb-4">
               <p className="text-xs text-rose-500 font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="relative group">
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <input type="text" placeholder="Họ và tên (VD: Anh Kiệt)" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all" required />
            </div>

            <div className="relative group">
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all" required />
            </div>

            <div className="relative group">
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all" required />
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Sign Up"}
            </button>
          </form>
        </div>

        <div className="hidden md:flex md:w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_white_0%,_transparent_70%)]"></div>
          <div className="relative z-10">
            <h3 className="text-indigo-200 text-[10px] font-black tracking-[0.3em] uppercase mb-4">Join Us</h3>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tighter">
              Start <br/> Splitting <br/> Smarter.
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}