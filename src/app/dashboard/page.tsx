"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // State quản lý Popup
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // State lưu dữ liệu
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [myGroups, setMyGroups] = useState<any[]>([]); // State lưu danh sách nhóm

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://split-bill-backend-5srl.onrender.com/api";

  // Kiểm tra đăng nhập và Load danh sách nhóm
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
      // Load danh sách nhóm đã lưu trên máy
      const savedGroups = localStorage.getItem("my_groups");
      if (savedGroups) setMyGroups(JSON.parse(savedGroups));
    }
  }, [router]);

  if (!user) return <div className="flex items-center justify-center min-h-screen">Đang tải dữ liệu...</div>;

  const handleLogout = () => {
    localStorage.clear(); // Xóa sạch mọi thứ khi đăng xuất
    router.push("/login");
  };

  // --- API TẠO NHÓM MỚI ---
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return toast.error("Vui lòng nhập tên nhóm!");
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: groupName,
          createdBy: user.userId 
        })
      });

      if (res.ok) {
        const newGroup = await res.json();
        
        // Lưu nhóm mới vào danh sách
        const updatedGroups = [...myGroups, newGroup];
        setMyGroups(updatedGroups);
        localStorage.setItem("my_groups", JSON.stringify(updatedGroups));

        toast.success(`Đã tạo nhóm "${newGroup.name}" thành công!`);
        setIsCreateOpen(false);
        setGroupName("");
        
        // 🚀 Ráp Link: Chuyển hướng thẳng vào trang Chi tiết Nhóm
        setTimeout(() => router.push(`/group/${newGroup.groupCode}`), 500);
      } else {
        toast.error("Lỗi khi tạo nhóm!");
      }
    } catch (err) {
      toast.error("Không thể kết nối Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  // --- API THAM GIA NHÓM ---
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return toast.error("Vui lòng nhập mã nhóm!");

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          joinCode: joinCode,
          userId: user.userId 
        })
      });

      if (res.ok) {
        const joinedGroup = await res.json();

        // Kiểm tra xem đã có trong danh sách chưa, chưa thì thêm vào
        const isExist = myGroups.find(g => g.groupCode === joinedGroup.groupCode);
        const updatedGroups = isExist ? myGroups : [...myGroups, joinedGroup];
        
        setMyGroups(updatedGroups);
        localStorage.setItem("my_groups", JSON.stringify(updatedGroups));

        toast.success(`Tham gia nhóm "${joinedGroup.name}" thành công!`);
        setIsJoinOpen(false);
        setJoinCode("");

        // 🚀 Ráp Link: Chuyển hướng thẳng vào trang Chi tiết Nhóm
        setTimeout(() => router.push(`/group/${joinedGroup.groupCode}`), 500);
      } else {
        const errorMsg = await res.text();
        toast.error(errorMsg || "Mã nhóm không hợp lệ!");
      }
    } catch (err) {
      toast.error("Không thể kết nối Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <img src={user.avatar || "https://via.placeholder.com/150"} alt="Avatar" className="w-14 h-14 rounded-full border-2 border-indigo-500 object-cover" />
            <div>
              <h2 className="text-xl font-black text-gray-800">Chào Sếp, {user.fullName}! 👋</h2>
              <p className="text-sm font-bold text-indigo-500">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-5 py-2 rounded-xl transition">
            Đăng xuất
          </button>
        </div>

        {/* Nút Hành động */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-2xl font-bold shadow-md transition transform hover:-translate-y-1">
            <span className="text-2xl block mb-2">+</span>
            Tạo nhóm mới
          </button>
          <button onClick={() => setIsJoinOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-2xl font-bold shadow-md transition transform hover:-translate-y-1">
            <span className="text-2xl block mb-2">🤝</span>
            Tham gia nhóm bằng Mã
          </button>
        </div>

        {/* Danh sách nhóm */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-4">📂 Danh sách nhóm của bạn</h3>
          
          {myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <span className="text-4xl mb-3">📂</span>
              <p className="text-gray-500 font-medium">Sếp chưa tham gia nhóm nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myGroups.map((g, idx) => (
                <div 
                  key={idx} 
                  onClick={() => router.push(`/group/${g.groupCode}`)} // 🚀 Ráp Link: Bấm thẻ nhóm bay thẳng vào Chi tiết
                  className="cursor-pointer bg-slate-50 border border-slate-100 hover:border-indigo-400 hover:shadow-md transition-all p-5 rounded-2xl flex justify-between items-center group"
                >
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{g.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">Mã nhóm: <span className="font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{g.groupCode}</span></p>
                  </div>
                  <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================= */}
        {/* POPUP TẠO NHÓM */}
        {/* ========================================= */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-black mb-4 text-indigo-600">Tạo nhóm mới</h2>
              <form onSubmit={handleCreateGroup}>
                <input 
                  type="text" 
                  placeholder="Nhập tên nhóm (VD: Đi Đà Lạt 30/4)..." 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full h-12 px-4 mb-6 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                  required
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="px-5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold">Hủy</button>
                  <button type="submit" disabled={isLoading} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700">
                    {isLoading ? "Đang tạo..." : "Xác nhận tạo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* POPUP THAM GIA NHÓM */}
        {/* ========================================= */}
        {isJoinOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-black mb-4 text-emerald-600">Tham gia nhóm</h2>
              <form onSubmit={handleJoinGroup}>
                <input 
                  type="text" 
                  placeholder="Nhập mã nhóm 6 số (VD: A1B2C3)..." 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full h-12 px-4 mb-6 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-black uppercase text-lg tracking-widest text-center"
                  maxLength={6}
                  required
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsJoinOpen(false)} className="px-5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold">Hủy</button>
                  <button type="submit" disabled={isLoading} className="px-5 py-2 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600">
                    {isLoading ? "Đang kiểm tra..." : "Tham gia"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}