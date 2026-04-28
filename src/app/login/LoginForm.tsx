"use client";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async (credentialResponse: any) => {
    const googleToken = credentialResponse.credential;

    try {
      // Bắn token lên Backend Render của Sếp để xác thực
      const res = await fetch("https://split-bill-backend-5srl.onrender.com/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: googleToken }),
      });

      const data = await res.json();

      if (res.ok) {
        // Lưu thông tin Sếp vào máy và chuyển qua Dashboard
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        alert(`Chào mừng ${data.fullName} đến với PAYSHARE!`);
        router.push("/dashboard"); // Đổi thành link trang chủ của Sếp
      } else {
        alert("Lỗi đăng nhập: " + data);
      }
    } catch (error) {
      console.error("Lỗi kết nối Backend:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Đăng nhập PAYSHARE</h1>
        
        {/* Nút Google thần thánh xuất hiện ở đây */}
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            console.log("Đăng nhập Google thất bại!");
          }}
        />
      </div>
    </div>
  );
}