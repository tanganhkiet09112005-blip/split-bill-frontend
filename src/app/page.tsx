"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import { Plus, Key, Users, LogOut, Loader2, ArrowRight, Wallet } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export default function LobbyPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  useEffect(() => {
    setIsMounted(true);
    const session = localStorage.getItem("user_session");
    if (!session) {
      window.location.href = "/login";
    } else {
      const userData = JSON.parse(session);
      setUser(userData);
      if (userData.id) {
        fetchGroups(userData.id);
      }
    }
  }, []);

  const fetchGroups = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error("Lỗi fetch groups:", err);
      toast.error("Không thể kết nối Server Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const loadingToast = toast.loading("Đang tạo nhóm...");
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          createdBy: user.id 
        })
      });

      if (res.ok) {
        const newGroup = await res.json();
        toast.success(`Tạo nhóm "${newGroup.name}" thành công!`, { id: loadingToast });
        setShowCreate(false);
        setNewGroupName("");
        fetchGroups(user.id); 
      } else {
        toast.error("Có lỗi xảy ra khi tạo nhóm", { id: loadingToast });
      }
    } catch (err) {
      toast.error("Lỗi kết nối Server!", { id: loadingToast });
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    const loadingToast = toast.loading("Đang kiểm tra mã nhóm...");
    try {
      const res = await fetch(`${API_URL}/groups/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinCode: joinCode,
          userId: user.id 
        })
      });

      if (res.ok) {
        const joinedGroup = await res.json();
        toast.success(`Đã tham gia nhóm ${joinedGroup.name}!`, { id: loadingToast });
        setShowJoin(false);
        setJoinCode("");
        fetchGroups(user.id); 
      } else {
        toast.error("Mã nhóm không đúng hoặc lỗi!", { id: loadingToast });
      }
    } catch (err) {
      toast.error("Lỗi kết nối Server!", { id: loadingToast });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    window.location.href = "/login";
  };

  if (!isMounted || !user) return <div className={`min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 ${sans.className}`}><Loader2 size={36} className="animate-spin" /></div>;

  return (
    <div className={`min-h-screen bg-slate-50 ${sans.className}`}>
      <Toaster position="top-center" />

      {/* HEADER */}
      <div className="bg-indigo-600 pb-20 pt-8 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-black tracking-tight mb-1">PAYSHARE</h1>
              <p className="text-xs text-indigo-200 font-medium tracking-wide">CHÀO MỪNG TRỞ LẠI</p>
            </div>
            <button onClick={handleLogout} className="p-2.5 bg-white/10 hover:bg-rose-500 rounded-xl transition-all flex items-center gap-2 text-sm font-bold shadow-sm">
              <LogOut size={16} /> Thoát
            </button>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold mb-2">Xin chào, {user.fullName || "Sếp"}!</h2>
            <p className="text-indigo-100 font-medium">Bạn muốn tính toán chi tiêu cho nhóm nào hôm nay?</p>
          </div>
        </div>
      </div>

      {/* MAIN LOBBY */}
      <div className="max-w-3xl mx-auto px-6 -mt-10 pb-20">
        
        {/* Nút thao tác nhanh */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={() => setShowCreate(true)} className="bg-white p-5 rounded-2xl shadow-lg shadow-indigo-100/50 border border-slate-100 hover:border-indigo-300 transition-all group text-left relative overflow-hidden">
            <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Tạo nhóm mới</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Lập quỹ chung cho chuyến đi</p>
          </button>

          <button onClick={() => setShowJoin(true)} className="bg-white p-5 rounded-2xl shadow-lg shadow-indigo-100/50 border border-slate-100 hover:border-indigo-300 transition-all group text-left relative overflow-hidden">
            <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
              <Key size={24} strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Vào nhóm bằng mã</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Nhập ID để tham gia tính tiền</p>
          </button>
        </div>

        {/* Danh sách nhóm */}
        <div>
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-indigo-600" /> Nhóm của bạn
          </h3>
          
          {isLoading ? (
            <div className="py-12 flex justify-center text-indigo-600"><Loader2 className="animate-spin" size={32} /></div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-slate-700">Chưa có nhóm nào</p>
              <p className="text-sm font-medium text-slate-500 mt-1">Hãy tạo một nhóm mới để bắt đầu chia tiền nhé!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map(group => (
                <div 
                  key={group.id} 
                  onClick={() => window.location.href = `/group/${group.groupCode || group.id}`} 
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between group/card"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover/card:text-indigo-600 transition-colors">{group.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Key size={12} /> ID: <span className="uppercase text-indigo-600 bg-indigo-50 px-1.5 rounded-md">{group.groupCode}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover/card:text-indigo-500 group-hover/card:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL TẠO NHÓM MỚI */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Tạo nhóm mới</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">Đặt tên cho chuyến đi hoặc mục đích chi tiêu chung.</p>
              <form onSubmit={handleCreateGroup}>
                <input autoFocus type="text" placeholder="VD: Nhậu ăn mừng đồ án A+" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 font-semibold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all mb-6" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Hủy</button>
                  <button type="submit" className="flex-1 h-12 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Tạo ngay</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL NHẬP MÃ NHÓM */}
      <AnimatePresence>
        {showJoin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Vào nhóm bằng mã</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">Hỏi bạn bè mã ID của nhóm để tham gia.</p>
              <form onSubmit={handleJoinGroup}>
                <input autoFocus type="text" placeholder="Nhập mã nhóm..." value={joinCode} onChange={e => setJoinCode(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-center text-lg text-indigo-600 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all mb-6 uppercase" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowJoin(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Hủy</button>
                  <button type="submit" className="flex-1 h-12 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Tham gia</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}