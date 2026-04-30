"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Tự động dùng URL của Render
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://split-bill-backend-5srl.onrender.com/api";

  // ─── 1. XỬ LÝ ĐĂNG NHẬP BẰNG TÀI KHOẢN THƯỜNG ──────────────────────────────
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
        const data = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token); 
          localStorage.setItem("user", JSON.stringify(data)); // Lưu dữ liệu user
        }
        toast.success(`Chào mừng Sếp ${data.fullName} trở lại!`);
        // CHỐT HẠ: Đăng nhập xong nhảy thẳng vào giao diện Dashboard tổng
        setTimeout(() => { router.push("/dashboard"); }, 1000); 
      } else {
        setError("Email hoặc mật khẩu không đúng!");
      }
    } catch (err) {
      setError("Không thể kết nối Server Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 2. XỬ LÝ ĐĂNG NHẬP BẰNG GOOGLE ─────────────────────────────────────────
  const handleGoogleLogin = async (credentialResponse: any) => {
    setIsLoading(true);
    const googleToken = credentialResponse.credential;
    console.log("Token lấy từ Google:", googleToken);

    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleToken }),
      });

      const data = await res.json();

      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data)); 
        }
        toast.success(`Đăng nhập thành công! Chào mừng Sếp ${data.fullName}`);
        // CHỐT HẠ: Đăng nhập Google xong cũng nhảy thẳng vào Dashboard tổng
        setTimeout(() => { router.push("/dashboard"); }, 1000);
      } else {
        toast.error("Lỗi từ Backend: " + (data.message || "Đăng nhập thất bại"));
        console.error("Chi tiết lỗi:", data);
      }
    } catch (error) {
      console.error("Lỗi gọi API:", error);
      toast.error("Không kết nối được với Server Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 ${sans.className}`}>
      <Toaster position="top-center" />
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px] border border-slate-100">
        
        {/* CỘT TRÁI (FORM) */}
        <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight mb-1">PAYSHARE</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Smart Group Spending</p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-sm font-medium text-slate-500">Đăng nhập để vào Bảng điều khiển.</p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mb-4 text-center">
               <p className="text-xs text-rose-500 font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-600 transition-all" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-600 transition-all" required />
            <button type="submit" disabled={isLoading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center shadow-md shadow-indigo-200">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Đăng nhập"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Hoặc</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* NÚT GOOGLE */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                console.log("Đăng nhập Google thất bại");
                toast.error("Đăng nhập Google bị hủy hoặc thất bại!");
              }}
              useOneTap
              shape="pill"
              theme="outline"
            />
          </div>

          <p className="text-center text-sm font-semibold text-slate-400 mt-8">
            Chưa có tài khoản? <span onClick={() => router.push('/signup')} className="text-indigo-600 hover:underline cursor-pointer">Sign up ngay</span>
          </p>
        </div>

        {/* CỘT BÊN PHẢI (BANNER) */}
        <div className="hidden md:flex md:w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_white_0%,_transparent_70%)]"></div>
          <h2 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] relative z-10">
            Effortless <br/> Shared <br/> Finances.
          </h2>
          <p className="text-indigo-200 mt-4 relative z-10 font-medium">Báo cáo đồ án xịn xò nhất IUH</p>
        </div>
      </div>
    </div>
  );
}