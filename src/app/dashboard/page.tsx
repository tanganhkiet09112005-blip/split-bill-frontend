"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  LayoutDashboard, Users, BarChart2, Plus, Sun, Moon, Monitor,
  HelpCircle, LogOut, Search, Bell, Plane, Home, ShoppingBag, Loader2, X, Trash2
} from "lucide-react";

// ─── UTILS & TOKENS ─────────────────────────────────────────────────────────
const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " đ";
const initials = (n: string) => n ? n.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

// Custom Hook LocalStorage
function useLS<T>(key: string, init: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [v, set] = useState<T>(() => {
    if (typeof window === "undefined") return init;
    try { const x = window.localStorage.getItem(key); return x ? JSON.parse(x) : init; } catch { return init; }
  });
  useEffect(() => { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { } }, [key, v]);
  return [v, set];
}

const tokens = {
  light: {
    bg: "bg-[#f8f9fc]", card: "bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]", cardHover: "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-slate-300/80",
    text: "text-slate-900", subText: "text-slate-500", muted: "text-slate-400",
    sidebar: "bg-white border-r border-slate-200/80", header: "bg-white/80 backdrop-blur-md border-b border-slate-200/80",
    input: "bg-slate-50 border-slate-200 focus:border-indigo-400",
    navItem: "text-slate-600 hover:bg-slate-50 hover:text-slate-900", navActive: "bg-indigo-50 text-indigo-700",
  },
  dark: {
    bg: "bg-[#0e1117]", card: "bg-[#161b27] border border-slate-700/50 shadow-md", cardHover: "hover:shadow-lg hover:border-slate-600",
    text: "text-slate-100", subText: "text-slate-400", muted: "text-slate-500",
    sidebar: "bg-[#0e1117] border-r border-slate-700/50", header: "bg-[#0e1117]/90 backdrop-blur-md border-b border-slate-700/50",
    input: "bg-slate-800/60 border-slate-700 focus:border-indigo-500",
    navItem: "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200", navActive: "bg-indigo-950/50 text-indigo-400",
  }
};

// Kiểu dữ liệu cho Nhóm
interface Group {
  id: string;
  name: string;
  type: string;
  members: number;
  balance: number;
  color: string;
}

// Data mẫu ban đầu
const initialGroups: Group[] = [
  { id: "1", name: "tay nguyen", type: "Trip", members: 4, balance: -740834, color: "bg-indigo-500" },
  { id: "2", name: "ha noi", type: "Trip", members: 5, balance: -350000, color: "bg-indigo-500" },
  { id: "3", name: "thanh pho ho chi minh", type: "Shopping", members: 3, balance: 40000, color: "bg-amber-500" },
  { id: "4", name: "quang tri", type: "Home", members: 4, balance: -17500, color: "bg-emerald-500" },
];

export default function DashboardPage() {
  const router = useRouter();
  
  // 🚀 STATE ĐỘNG CHỐNG MẤT DATA
  const [dark, setDark] = useLS("payshare_dark", false);
  const [groups, setGroups] = useLS<Group[]>("payshare_dashboard_groups", initialGroups);
  
  const [userName, setUserName] = useState("Anh Kiệt");
  const [isLoading, setIsLoading] = useState(true);
  
  // State Modal Thêm Nhóm
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState("Trip");

  // 🚀 STATE LƯU TRỮ CHỈ SỐ PHÂN TÍCH TỔNG
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const t = dark ? tokens.dark : tokens.light;

  useEffect(() => {
    const session = localStorage.getItem("user");
    if (session) {
      setUserName(JSON.parse(session).fullName || "Anh Kiệt");
    } else {
      router.push("/login"); 
    }
    setTimeout(() => setIsLoading(false), 400);
  }, [router]);

  // 🚀 THUẬT TOÁN QUÉT DỮ LIỆU ĐỘNG TỪ LOCALSTORAGE
  useEffect(() => {
    let currentBalance = 0;
    let currentSpent = 0;

    groups.forEach(g => {
      // 1. Cộng dồn Balance (Nợ nần)
      currentBalance += g.balance;

      // 2. Chui vào LocalStorage quét tìm hóa đơn của từng nhóm
      try {
        const localData = localStorage.getItem(`payshare_expenses_${g.id}`);
        if (localData) {
          const groupExpenses: any[] = JSON.parse(localData);
          if (Array.isArray(groupExpenses)) {
            // Cộng dồn tất cả số tiền đã chi tiêu trong nhóm đó
            currentSpent += groupExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
          }
        }
      } catch (e) {
        console.error("Lỗi đọc dữ liệu hóa đơn của nhóm:", g.id);
      }
    });

    setTotalBalance(currentBalance);
    setTotalSpent(currentSpent);
  }, [groups]); // Chạy lại mỗi khi danh sách nhóm thay đổi hoặc vừa Load trang

  const toggleTheme = (val: boolean) => setDark(val);

  const getIcon = (type: string) => {
    if (type === "Trip") return <Plane size={18} className="text-white" />;
    if (type === "Shopping") return <ShoppingBag size={18} className="text-white" />;
    return <Home size={18} className="text-white" />;
  };

  // 🚀 HÀM THÊM NHÓM
  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return toast.error("Chưa nhập tên nhóm Sếp ơi!");

    let color = "bg-indigo-500";
    if (newGroupType === "Shopping") color = "bg-amber-500";
    if (newGroupType === "Home") color = "bg-emerald-500";

    const newGroup: Group = {
      id: `group_${Date.now()}`,
      name: newGroupName,
      type: newGroupType,
      members: 1, 
      balance: 0,
      color: color
    };

    setGroups(prev => [newGroup, ...prev]);
    toast.success(`Đã tạo nhóm "${newGroupName}" thành công!`);
    
    setNewGroupName("");
    setNewGroupType("Trip");
    setIsAddGroupOpen(false);
  };

  // 🚀 HÀM XÓA NHÓM
  const handleDeleteGroup = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); 
    if (window.confirm(`Sếp có chắc chắn muốn xóa nhóm "${name}" không? Toàn bộ dữ liệu sẽ mất!`)) {
      setGroups(prev => prev.filter(g => g.id !== id));
      toast.success("Đã xóa nhóm!");
      localStorage.removeItem(`payshare_members_${id}`);
      localStorage.removeItem(`payshare_expenses_${id}`);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc]">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
      <p className="text-slate-500 font-medium">Đang tải Bảng điều khiển...</p>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${t.bg}`}>
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontWeight: 600, fontSize: '13px' } }} />

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <aside className={`w-[240px] hidden md:flex flex-col ${t.sidebar}`}>
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-indigo-600 tracking-tight">PayShare</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          <button className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${t.navActive}`}>
            <LayoutDashboard size={18} className="text-indigo-600" /> Dashboard
          </button>
          <button className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${t.navItem}`}>
            <Users size={18} className="opacity-70" /> Groups
          </button>
          <button className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${t.navItem}`}>
            <BarChart2 size={18} className="opacity-70" /> Analytics
          </button>
          
          <div className="pt-6 pb-2">
            <button 
              onClick={() => setIsAddGroupOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200/50 dark:shadow-none"
            >
              <Plus size={18} /> New Group
            </button>
          </div>
        </nav>

        <div className="px-4 pb-6 space-y-4">
          <div className={`flex p-1 rounded-xl border ${dark ? 'bg-[#0e1117] border-slate-800' : 'bg-white border-slate-200'}`}>
            <button onClick={() => toggleTheme(false)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${!dark ? 'bg-slate-100 text-indigo-600' : t.muted}`}><Sun size={14} /> Light</button>
            <button onClick={() => toggleTheme(true)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${dark ? 'bg-slate-800 text-indigo-400' : t.muted}`}><Moon size={14} /> Dark</button>
            <button className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${t.muted}`}><Monitor size={14} /> System</button>
          </div>

          <button className={`w-full flex items-center gap-3 px-2 py-2 text-sm font-medium transition-all ${t.navItem}`}>
            <HelpCircle size={18} className="opacity-60" /> Help
          </button>
          <button onClick={() => { localStorage.removeItem("user"); router.push("/login"); }} className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
            <LogOut size={18} className="opacity-70" /> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* HEADER */}
        <header className={`h-20 flex items-center justify-between px-8 shrink-0`}>
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border w-full max-w-md bg-white dark:bg-[#161b27] dark:border-slate-700 shadow-sm`}>
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Search groups, expenses..." className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400 dark:text-white" />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
            </button>
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {initials(userName)[0]}
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className={`flex-1 overflow-y-auto px-8 pb-10`}>
          <div className="max-w-[1200px]">
            
            {/* 3 STAT CARDS - SỐ LIỆU ĐÃ ĐƯỢC LÀM SỐNG */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-2">
               <div className={`p-6 rounded-2xl ${t.card}`}>
                 <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${t.muted}`}>Net Balance</p>
                 <p className={`text-[28px] font-black leading-tight ${totalBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                   {fmtVND(totalBalance)}
                 </p>
                 <p className={`text-xs font-medium mt-1 ${t.muted}`}>{totalBalance < 0 ? 'You owe money' : 'You are owed'}</p>
               </div>
               <div className={`p-6 rounded-2xl ${t.card}`}>
                 <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${t.muted}`}>Total Groups</p>
                 <p className={`text-[28px] font-black leading-tight ${t.text}`}>{groups.length}</p>
                 <p className={`text-xs font-medium mt-1 ${t.muted}`}>Active groups</p>
               </div>
               <div className={`p-6 rounded-2xl ${t.card}`}>
                 <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${t.muted}`}>Total Spent</p>
                 <p className="text-[28px] font-black text-indigo-600 leading-tight">{fmtVND(totalSpent)}</p>
                 <p className={`text-xs font-medium mt-1 ${t.muted}`}>Across all groups</p>
               </div>
            </div>

            {/* YOUR GROUPS SECTION */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className={`text-lg font-bold ${t.text}`}>Your Groups</h2>
              <button onClick={() => setIsAddGroupOpen(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <Plus size={16}/> Add Group
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {groups.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <p className={`text-slate-400 italic text-sm`}>Sếp chưa có nhóm nào, bấm tạo ngay đi!</p>
                </div>
              ) : groups.map((group) => (
                <motion.div 
                  key={group.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  onClick={() => router.push(`/group/${group.id}`)}
                  className={`relative group p-5 rounded-2xl cursor-pointer transition-all duration-200 ${t.card} ${t.cardHover}`}
                >
                  {/* NÚT XÓA ẨN HIỆN KHI HOVER */}
                  <button 
                    onClick={(e) => handleDeleteGroup(e, group.id, group.name)}
                    className="absolute top-3 right-3 p-2 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-start gap-4 mb-8">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${group.color}`}>
                      {getIcon(group.type)}
                    </div>
                    <div className="pr-6">
                      <h3 className={`font-bold text-base line-clamp-1 ${t.text}`}>{group.name}</h3>
                      <span className={`inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-semibold ${dark ? 'bg-slate-800 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                        {group.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between mb-3">
                    <p className={`text-xs font-medium ${t.muted}`}>{group.members} members</p>
                    <p className={`text-sm font-bold ${group.balance < 0 ? 'text-rose-500' : group.balance > 0 ? 'text-emerald-500' : t.subText}`}>
                      {group.balance > 0 ? '+' : ''}{fmtVND(group.balance)}
                    </p>
                  </div>
                  
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${group.balance < 0 ? 'bg-rose-500' : group.balance > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} 
                      style={{ width: group.balance === 0 ? '0%' : '100%' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* RECENT ACTIVITY */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className={`text-lg font-bold ${t.text}`}>Recent Activity</h2>
            </div>
            <div className={`p-6 rounded-2xl ${t.card}`}>
               <p className={`text-sm italic ${t.muted}`}>Mọi khoản chi tiêu sẽ tự động được cộng dồn lên thẻ Total Spent.</p>
            </div>

          </div>
        </div>
      </main>

      {/* ── MODAL THÊM NHÓM ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddGroupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setIsAddGroupOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }}
              className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl ${dark ? 'bg-[#161b27] border border-slate-700/50' : 'bg-white border border-slate-200/80'}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className={`text-lg font-black ${t.text}`}>Tạo nhóm mới</h3>
                  <p className={`text-xs font-medium mt-0.5 ${t.muted}`}>Đi chơi, Mua sắm hay Tiền nhà?</p>
                </div>
                <button onClick={() => setIsAddGroupOpen(false)} className={`p-2 rounded-lg transition-colors ${t.navItem}`}><X size={18}/></button>
              </div>
              <form onSubmit={handleAddGroup} className="space-y-4">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1.5 ${t.subText}`}>Tên nhóm</label>
                  <input 
                    type="text" 
                    placeholder="VD: Đi Đà Lạt, Tiền trọ..." 
                    value={newGroupName} 
                    onChange={(e) => setNewGroupName(e.target.value)} 
                    className={`w-full h-12 px-4 border-2 rounded-xl outline-none font-semibold text-sm transition-all ${dark ? 'bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-400 placeholder:text-slate-400'}`}
                    required autoFocus 
                  />
                </div>
                
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1.5 ${t.subText}`}>Loại nhóm</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Trip", "Shopping", "Home"].map(type => (
                      <button
                        key={type} type="button"
                        onClick={() => setNewGroupType(type)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${newGroupType === type ? 'bg-indigo-600 border-indigo-600 text-white' : `${dark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300'}`}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full mt-2 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200/50 dark:shadow-none flex items-center justify-center gap-2 transition-all">
                  <Plus size={16}/> Khởi tạo Nhóm
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}