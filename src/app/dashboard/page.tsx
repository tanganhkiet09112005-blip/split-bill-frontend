"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  LayoutDashboard, Users, BarChart2, Plus, Sun, Moon, Monitor,
  HelpCircle, LogOut, Search, Bell, Plane, Home, ShoppingBag, Loader2, X, Trash2, PieChartIcon
} from "lucide-react";

// ─── UTILS & TOKENS ─────────────────────────────────────────────────────────
const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " đ";
const initials = (n: string) => n ? n.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

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

interface Group { id: string; name: string; type: string; members: number; balance: number; color: string; }

export default function DashboardPage() {
  const router = useRouter();
  
  // Giao diện
  const [dark, setDark] = useLS("payshare_dark", false);
  const [activeTab, setActiveTab] = useState("dashboard"); // Quản lý Menu Trái
  
  // Dữ liệu User & Độc lập
  const [userId, setUserId] = useState("guest");
  const [userName, setUserName] = useState("Anh Kiệt");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState("Trip");

  const [totalBalance, setTotalBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<{type: string, spent: number, color: string}[]>([]);

  const t = dark ? tokens.dark : tokens.light;

  // 🚀 BƯỚC 1: NHẬN DIỆN USER & TẢI DATA RIÊNG BIỆT
  useEffect(() => {
    const session = localStorage.getItem("user");
    if (session) {
      const u = JSON.parse(session);
      setUserName(u.fullName || "Anh Kiệt");
      const uid = u.id || u.email || "guest";
      setUserId(uid);

      // Kéo Data nhóm của riêng User này ra (Tài khoản mới sẽ trống trơn [])
      const userGroups = localStorage.getItem(`payshare_groups_${uid}`);
      if (userGroups) setGroups(JSON.parse(userGroups));
      else setGroups([]); 
    } else {
      router.push("/login"); 
    }
    setTimeout(() => setIsLoading(false), 400);
  }, [router]);

  // 🚀 BƯỚC 2: LƯU DATA RIÊNG LẠI CHO USER ĐÓ MỖI KHI CÓ THAY ĐỔI
  useEffect(() => {
    if (!isLoading && userId !== "guest") {
      localStorage.setItem(`payshare_groups_${userId}`, JSON.stringify(groups));
    }
  }, [groups, isLoading, userId]);

  // 🚀 BƯỚC 3: QUÉT DATA ĐỂ VẼ BIỂU ĐỒ ANALYTICS TỔNG
  useEffect(() => {
    let currentBalance = 0;
    let currentSpent = 0;
    const typeStats: Record<string, number> = { Trip: 0, Shopping: 0, Home: 0 };

    groups.forEach(g => {
      currentBalance += g.balance;
      try {
        const localData = localStorage.getItem(`payshare_expenses_${g.id}`);
        if (localData) {
          const groupExpenses: any[] = JSON.parse(localData);
          if (Array.isArray(groupExpenses)) {
            const spentInGroup = groupExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
            currentSpent += spentInGroup;
            if(typeStats[g.type] !== undefined) typeStats[g.type] += spentInGroup;
          }
        }
      } catch (e) {}
    });

    setTotalBalance(currentBalance);
    setTotalSpent(currentSpent);
    
    // Đổ data cho màn hình Analytics
    setAnalyticsData([
       { type: "Du lịch (Trip)", spent: typeStats["Trip"], color: "bg-indigo-500" },
       { type: "Mua sắm (Shopping)", spent: typeStats["Shopping"], color: "bg-amber-500" },
       { type: "Gia đình (Home)", spent: typeStats["Home"], color: "bg-emerald-500" },
    ].filter(item => item.spent > 0).sort((a,b) => b.spent - a.spent)); // Chỉ hiện mục có xài tiền, xếp từ cao xuống thấp
  }, [groups]);

  const toggleTheme = (val: boolean) => setDark(val);

  const getIcon = (type: string) => {
    if (type === "Trip") return <Plane size={18} className="text-white" />;
    if (type === "Shopping") return <ShoppingBag size={18} className="text-white" />;
    return <Home size={18} className="text-white" />;
  };

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
    toast.success(`Đã tạo nhóm "${newGroupName}"!`);
    setNewGroupName(""); setNewGroupType("Trip"); setIsAddGroupOpen(false);
  };

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
      <p className="text-slate-500 font-medium">Đang tải cấu hình...</p>
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
          <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "dashboard" ? t.navActive : t.navItem}`}>
            <LayoutDashboard size={18} className={activeTab === "dashboard" ? "text-indigo-600" : "opacity-70"} /> Dashboard
          </button>
          <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${t.navItem}`}>
            <Users size={18} className="opacity-70" /> Groups
          </button>
          <button onClick={() => setActiveTab("analytics")} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "analytics" ? t.navActive : t.navItem}`}>
            <BarChart2 size={18} className={activeTab === "analytics" ? "text-indigo-600" : "opacity-70"} /> Analytics
          </button>
          
          <div className="pt-6 pb-2">
            <button onClick={() => setIsAddGroupOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200/50 dark:shadow-none">
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
          <button onClick={() => { localStorage.removeItem("user"); localStorage.removeItem("token"); router.push("/login"); }} className="w-full flex items-center gap-3 px-2 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
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
            <input type="text" placeholder="Tìm kiếm nhóm, khoản chi..." className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400 dark:text-white" />
          </div>

          <div className="flex items-center gap-4">
            <div className={`text-right hidden sm:block`}>
              <p className={`text-sm font-bold leading-tight ${t.text}`}>{userName}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.muted}`}>Tài khoản cá nhân</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {initials(userName)[0]}
            </div>
          </div>
        </header>

        {/* NỘI DUNG THAY ĐỔI THEO TAB */}
        <div className={`flex-1 overflow-y-auto px-8 pb-10`}>
          <div className="max-w-[1200px]">
            
            {/* ── GÓC DASHBOARD ── */}
            {activeTab === "dashboard" && (
              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-2">
                   <div className={`p-6 rounded-2xl ${t.card}`}>
                     <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${t.muted}`}>Net Balance</p>
                     <p className={`text-[28px] font-black leading-tight ${totalBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                       {fmtVND(totalBalance)}
                     </p>
                     <p className={`text-xs font-medium mt-1 ${t.muted}`}>{totalBalance < 0 ? 'Bạn đang nợ tiền' : 'Mọi người nợ bạn'}</p>
                   </div>
                   <div className={`p-6 rounded-2xl ${t.card}`}>
                     <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${t.muted}`}>Total Groups</p>
                     <p className={`text-[28px] font-black leading-tight ${t.text}`}>{groups.length}</p>
                     <p className={`text-xs font-medium mt-1 ${t.muted}`}>Nhóm đang hoạt động</p>
                   </div>
                   <div className={`p-6 rounded-2xl ${t.card}`}>
                     <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${t.muted}`}>Total Spent</p>
                     <p className="text-[28px] font-black text-indigo-600 leading-tight">{fmtVND(totalSpent)}</p>
                     <p className={`text-xs font-medium mt-1 ${t.muted}`}>Tổng đã chi tiêu</p>
                   </div>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <h2 className={`text-lg font-bold ${t.text}`}>Các Nhóm Của Sếp</h2>
                  <button onClick={() => setIsAddGroupOpen(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    <Plus size={16}/> Thêm Nhóm
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {groups.length === 0 ? (
                    <div className={`col-span-full text-center py-16 rounded-2xl border border-dashed ${dark ? 'border-slate-700' : 'border-slate-300'}`}>
                      <p className={`text-slate-400 italic text-sm font-medium`}>Tài khoản mới tinh. Bấm "Thêm Nhóm" để bắt đầu chia tiền nhé Sếp!</p>
                    </div>
                  ) : groups.map((group) => (
                    <motion.div key={group.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ y: -4 }} onClick={() => router.push(`/group/${group.id}`)} className={`relative group p-5 rounded-2xl cursor-pointer transition-all duration-200 ${t.card} ${t.cardHover}`}>
                      <button onClick={(e) => handleDeleteGroup(e, group.id, group.name)} className="absolute top-3 right-3 p-2 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"><Trash2 size={16} /></button>
                      <div className="flex items-start gap-4 mb-8">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${group.color}`}>{getIcon(group.type)}</div>
                        <div className="pr-6">
                          <h3 className={`font-bold text-base line-clamp-1 ${t.text}`}>{group.name}</h3>
                          <span className={`inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-semibold ${dark ? 'bg-slate-800 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>{group.type}</span>
                        </div>
                      </div>
                      <div className="flex items-end justify-between mb-3">
                        <p className={`text-xs font-medium ${t.muted}`}>Id: ...{group.id.slice(-4)}</p>
                        <p className={`text-sm font-bold ${group.balance < 0 ? 'text-rose-500' : group.balance > 0 ? 'text-emerald-500' : t.subText}`}>
                          {group.balance > 0 ? '+' : ''}{fmtVND(group.balance)}
                        </p>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${group.balance < 0 ? 'bg-rose-500' : group.balance > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: group.balance === 0 ? '0%' : '100%' }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── GÓC ANALYTICS (NÂNG CẤP MỚI) ── */}
            {activeTab === "analytics" && (
              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="pt-4 max-w-[800px] mx-auto">
                <div className="mb-8">
                  <h2 className={`text-2xl font-black ${t.text}`}>Phân tích chi tiêu tổng thể</h2>
                  <p className={`text-sm mt-1 ${t.subText}`}>Thống kê phân bổ dòng tiền từ tất cả các nhóm của Sếp.</p>
                </div>
                
                <div className={`p-8 rounded-3xl ${t.card}`}>
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <PieChartIcon size={20} className="text-indigo-500" />
                        <h3 className={`text-base font-bold ${t.text}`}>Phân bổ ngân sách</h3>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng tiền đã ra đi</p>
                         <p className="text-2xl font-black text-indigo-600">{fmtVND(totalSpent)}</p>
                      </div>
                   </div>
                   
                   {analyticsData.length === 0 ? (
                      <div className="text-center py-16 italic text-slate-400 text-sm font-medium">Sếp chưa chi đồng nào, tài chính đang quá an toàn!</div>
                   ) : (
                      <div className="space-y-7 mt-4">
                         {analyticsData.map((item, idx) => {
                            const pct = totalSpent > 0 ? Math.round((item.spent / totalSpent) * 100) : 0;
                            return (
                               <div key={idx}>
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2.5">
                                       <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
                                       <span className={`font-bold text-sm ${t.text}`}>{item.type}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <span className={`text-sm font-semibold tabular-nums ${t.subText}`}>{fmtVND(item.spent)}</span>
                                       <span className={`text-xs font-black tabular-nums px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 ${t.text}`}>{pct}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                     <motion.div initial={{width: 0}} animate={{width: `${pct}%`}} transition={{duration: 0.8, ease: "easeOut"}} className={`h-full rounded-full ${item.color}`} />
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   )}
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </main>

      {/* ── MODAL THÊM NHÓM ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddGroupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setIsAddGroupOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }} className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl ${dark ? 'bg-[#161b27] border border-slate-700/50' : 'bg-white border border-slate-200/80'}`}>
              <div className="flex items-start justify-between mb-6">
                <div><h3 className={`text-lg font-black ${t.text}`}>Tạo nhóm mới</h3><p className={`text-xs font-medium mt-0.5 ${t.muted}`}>Đi chơi, Mua sắm hay Tiền nhà?</p></div>
                <button onClick={() => setIsAddGroupOpen(false)} className={`p-2 rounded-lg transition-colors ${t.navItem}`}><X size={18}/></button>
              </div>
              <form onSubmit={handleAddGroup} className="space-y-4">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1.5 ${t.subText}`}>Tên nhóm</label>
                  <input type="text" placeholder="VD: Đi Đà Lạt, Tiền trọ..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className={`w-full h-12 px-4 border-2 rounded-xl outline-none font-semibold text-sm transition-all ${dark ? 'bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-400 placeholder:text-slate-400'}`} required autoFocus />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1.5 ${t.subText}`}>Loại nhóm</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Trip", "Shopping", "Home"].map(type => (
                      <button key={type} type="button" onClick={() => setNewGroupType(type)} className={`py-2 rounded-xl text-xs font-bold transition-all border ${newGroupType === type ? 'bg-indigo-600 border-indigo-600 text-white' : `${dark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300'}`}`}>{type}</button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full mt-2 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200/50 dark:shadow-none flex items-center justify-center gap-2 transition-all"><Plus size={16}/> Khởi tạo Nhóm</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}