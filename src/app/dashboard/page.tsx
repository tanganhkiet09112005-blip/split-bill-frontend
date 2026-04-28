"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Kiểm tra xem Sếp đã có vé vào cửa (đăng nhập) chưa
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login"); // Chưa có thì mời về trang Login
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  // Nếu đang load thì hiện chữ này
  if (!user) return <div className="flex items-center justify-center min-h-screen text-xl font-bold text-gray-600">Đang tải dữ liệu PAYSHARE...</div>;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header: Thông tin Sếp và nút Đăng xuất */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-8 border border-gray-100">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <img 
              src={user.avatar || "https://via.placeholder.com/150"} 
              alt="Avatar" 
              className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover" 
            />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Chào Sếp, {user.fullName}! 👋</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-5 py-2 rounded-xl transition duration-200"
          >
            Đăng xuất
          </button>
        </div>

        {/* Nút Hành động siêu to khổng lồ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => alert("Chuẩn bị mở Popup Tạo nhóm...")}
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl font-bold shadow-md transition transform hover:-translate-y-1"
          >
            <span className="text-2xl block mb-2">+</span>
            Tạo nhóm mới
          </button>
          <button 
            onClick={() => alert("Chuẩn bị mở Popup Nhập mã nhóm...")}
            className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-2xl font-bold shadow-md transition transform hover:-translate-y-1"
          >
            <span className="text-2xl block mb-2">🤝</span>
            Tham gia nhóm bằng Mã
          </button>
        </div>

        {/* Khu vực danh sách nhóm */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Danh sách nhóm của bạn</h3>
          
          {/* Tạm thời hiển thị trạng thái trống */}
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <span className="text-4xl mb-3">📂</span>
            <p className="text-gray-500 font-medium">Sếp chưa tham gia nhóm nào.</p>
            <p className="text-gray-400 text-sm mt-1">Hãy tạo hoặc tham gia nhóm để bắt đầu chia tiền nhé!</p>
          </div>
        </div>

      </div>
    </div>
  );
}