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

  // State lưu dữ liệu form
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [myGroups, setMyGroups] = useState<any[]>([]); 

  // ĐỊA CHỈ BACKEND CHUẨN TRÊN RENDER
  const API_URL = "https://split-bill-backend-5srl.onrender.com/api";

  // Kiểm tra đăng nhập và Load danh sách nhóm
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Load danh sách nhóm đã lưu trên máy (Local Cache)
      const savedGroups = localStorage.getItem("my_groups");
      if (savedGroups) setMyGroups(JSON.parse(savedGroups));

      // 🚀 MẸO: Tự động gửi 1 request nhẹ để gọi Backend thức dậy (Wake-up call)
      // Thằng Render Free thường ngủ sau 15p, mình gọi thế này để lúc Sếp bấm nút nó không bị xoay lâu.
      fetch(`${API_URL}/auth/signup`).catch(() => {}); 
    }
  }, [router]);

  if (!user) return <div className="flex items-center justify-center min-h-screen font-bold text-slate-400">Đang tải dữ liệu PAYSHARE...</div>;

  const handleLogout = () => {
    localStorage.clear(); 
    router.push("/login");
  };

  // --- API TẠO NHÓM MỚI (ĐÃ FIX LOGIC) ---
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return toast.error("Vui lòng nhập tên nhóm!");
    
    // 🛡️ KIỂM TRA BẢO VỆ: Nếu không có ID người dùng thì không cho tạo
    if (!user?.userId) {
      return toast.error("Phiên đăng nhập lỗi, Sếp hãy thoát ra vào lại!");
    }

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
        
        // Cập nhật danh sách hiển thị và lưu vào bộ nhớ máy
        const updatedGroups = [newGroup, ...myGroups];
        setMyGroups(updatedGroups);
        localStorage.setItem("my_groups", JSON.stringify(updatedGroups));

        toast.success(`Đã tạo nhóm "${newGroup.name}" thành công!`);
        setIsCreateOpen(false);
        setGroupName("");
        
        // Chuyển hướng thẳng vào trang Chi tiết Nhóm để chia tiền luôn
        setTimeout(() => router.push(`/group/${newGroup.groupCode}`), 800);
      } else {
        const errorText = await res.text();
        toast.error(`Lỗi tạo nhóm: ${errorText || "Server từ chối"}`);
      }
    } catch (err) {
      toast.error("Không kết nối được Backend! Sếp đợi 30s cho server 'thức' nhé.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- API THAM GIA NHÓM (ĐÃ FIX LOGIC) ---
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return toast.error("Vui lòng nhập mã nhóm!");
    if (!user?.userId) return toast.error("Lỗi xác thực người dùng!");

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

        // Thêm vào danh sách nếu chưa có
        const isExist = myGroups.find(g => g.groupCode === joinedGroup.groupCode);
        const updatedGroups = isExist ? myGroups : [joinedGroup, ...myGroups];
        
        setMyGroups(updatedGroups);
        localStorage.setItem("my_groups", JSON.stringify(updatedGroups));

        toast.success(`Tham gia nhóm "${joinedGroup.name}" thành công!`);
        setIsJoinOpen(false);
        setJoinCode("");

        setTimeout(() => router.push(`/group/${joinedGroup.groupCode}`), 800);
      } else {
        const errorMsg = await res.text();
        toast.error(errorMsg || "Mã nhóm không hợp lệ!");
      }
    } catch (err) {
      toast.error("Lỗi kết nối Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm mb-8 border border-slate-100">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-sm">👤</div>
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Chào Sếp, {user.fullName || "Kiệt"}! 👋</h2>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-6 py-2.5 rounded-2xl transition-all active:scale-95">
            Đăng xuất
          </button>
        </div>

        {/* Nút Hành động */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white p-8 rounded-[2rem] font-bold shadow-xl shadow-indigo-100 transition transform hover:-translate-y-1 active:scale-95 flex flex-col items-center gap-2">
            <span className="text-3xl bg-white/20 w-12 h-12 flex items-center justify-center rounded-full">+</span>
            <span className="text-lg">Tạo nhóm mới</span>
          </button>
          <button onClick={() => setIsJoinOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white p-8 rounded-[2rem] font-bold shadow-xl shadow-emerald-100 transition transform hover:-translate-y-1 active:scale-95 flex flex-col items-center gap-2">
            <span className="text-3xl bg-white/20 w-12 h-12 flex items-center justify-center rounded-full">🤝</span>
            <span className="text-lg">Vào nhóm bằng Mã</span>
          </button>
        </div>

        {/* Danh sách nhóm */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[300px]">
          <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">📂 Danh sách nhóm của bạn</h3>
          
          {myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
              <span className="text-5xl mb-4 opacity-20">📂</span>
              <p className="text-slate-400 font-bold">Sếp chưa có nhóm nào.</p>
              <p className="text-slate-300 text-xs mt-1">Hãy tạo nhóm để bắt đầu chia tiền nhé!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myGroups.map((g, idx) => (
                <div 
                  key={idx} 
                  onClick={() => router.push(`/group/${g.groupCode}`)}
                  className="cursor-pointer bg-slate-50/50 border border-slate-100 hover:border-indigo-400 hover:bg-white hover:shadow-lg transition-all p-6 rounded-[1.5rem] flex justify-between items-center group active:scale-[0.98]"
                >
                  <div>
                    <h4 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{g.name}</h4>
                    <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest bg-indigo-50 w-max px-2 py-0.5 rounded-md border border-indigo-100">Mã: {g.groupCode}</p>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <span className="text-xl">➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* POPUP TẠO NHÓM */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white">
              <h2 className="text-2xl font-black mb-2 text-indigo-600">Tạo nhóm mới</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Bắt đầu chia sẻ chi tiêu</p>
              <form onSubmit={handleCreateGroup}>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Đi Đà Lạt 30/4..." 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full h-14 px-6 mb-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-lg"
                  required
                  autoFocus
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 h-12 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition">Hủy</button>
                  <button type="submit" disabled={isLoading} className="flex-[2] h-12 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50">
                    {isLoading ? "Đang tạo..." : "Xác nhận tạo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* POPUP THAM GIA NHÓM */}
        {isJoinOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-white">
              <h2 className="text-2xl font-black mb-2 text-emerald-600">Tham gia nhóm</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Nhập mã 6 ký tự được chia sẻ</p>
              <form onSubmit={handleJoinGroup}>
                <input 
                  type="text" 
                  placeholder="A1B2C3" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full h-20 px-4 mb-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 font-black uppercase text-3xl tracking-[0.5em] text-center"
                  maxLength={6}
                  required
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsJoinOpen(false)} className="flex-1 h-12 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition">Hủy</button>
                  <button type="submit" disabled={isLoading} className="flex-[2] h-12 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50">
                    {isLoading ? "Đang kiểm tra..." : "Tham gia ngay"}
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