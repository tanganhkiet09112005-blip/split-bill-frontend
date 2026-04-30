"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, BarChart2, Plus, Sun, Moon, Monitor,
  HelpCircle, LogOut, Search, Bell, Plane, Home, ShoppingBag, Loader2
} from "lucide-react";

// ─── UTILS & TOKENS (Đồng bộ với trang Chi tiết nhóm) ─────────────────────
const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " đ";
const initials = (n: string) => n ? n.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

const tokens = {
  light: {
    bg: "bg-[#f8f9fc]", card: "bg-white border border-slate-200/80 shadow-sm", cardHover: "hover:shadow-md hover:border-slate-300",
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

// ─── FAKE DATA THEO ĐÚNG ẢNH MẪU ──────────────────────────────────────────
const mockGroups = [
  { id: "1", name: "tay nguyen", type: "Trip", members: 4, balance: -740834, color: "bg-indigo-500" },
  { id: "2", name: "ha noi", type: "Trip", members: 5, balance: -350000, color: "bg-indigo-500" },
  { id: "3", name: "thanh pho ho chi minh", type: "Shopping", members: 3, balance: 40000, color: "bg-amber-400" },
  { id: "4", name: "quang tri", type: "Home", members: 4, balance: -17500, color: "bg-emerald-500" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [userName, setUserName] = useState("Anh Kiệt");
  const [isLoading, setIsLoading] = useState(true);
  
  const t = dark ? tokens.dark : tokens.light;

  useEffect(() => {
    // Kéo theme và user từ LocalStorage
    const storedDark = localStorage.getItem("payshare_dark");
    if (storedDark) setDark(JSON.parse(storedDark));
    
    const session = localStorage.getItem("user");
    if (session) {
      setUserName(JSON.parse(session).fullName || "Anh Kiệt");
    } else {
      router.push("/login"); // Nếu chưa đăng nhập thì đá về trang Login
    }
    
    // Giả lập load data nhanh
    setTimeout(() => setIsLoading(false), 600);
  }, [router]);

  const toggleTheme = (val: boolean) => {
    setDark(val);
    localStorage.setItem("payshare_dark", JSON.stringify(val));
  };

  const getIcon = (type: string) => {
    if (type === "Trip") return <Plane size={18} className="text-white" />;
    if (type === "Shopping") return <ShoppingBag size={18} className="text-white" />;
    return <Home size={18} className="text-white" />;
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc]">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
      <p className="text-slate-500 font-medium">Đang tải Dashboard...</p>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${t.bg}`}>
      
      {/* ── SIDEBAR (Giống ảnh mẫu 100%) ─────────────────────────────────── */}
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
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200/50 dark:shadow-none">
              <Plus size={18} /> New Group
            </button>
          </div>
        </nav>

        <div className="px-4 pb-6 space-y-4">
          {/* Nút Light/Dark/System y hệt ảnh */}
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
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {initials(userName)[0]}
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className={`flex-1 overflow-y-auto px-8 pb-10`}>
          <div className="max-w-[1200px]">
            
            {/* 3 STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-2">
               <div className={`p-6 rounded-2xl ${t.card}`}>
                 <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${t.muted}`}>Net Balance</p>
                 <p className="text-[28px] font-black text-rose-500 leading-tight">-1.068.334 đ</p>
                 <p className={`text-xs font-medium mt-1 ${t.muted}`}>You owe money</p>
               </div>
               <div className={`p-6 rounded-2xl ${t.card}`}>
                 <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${t.muted}`}>Total Groups</p>
                 <p className={`text-[28px] font-black leading-tight ${t.text}`}>5</p>
                 <p className={`text-xs font-medium mt-1 ${t.muted}`}>Active groups</p>
               </div>
               <div className={`p-6 rounded-2xl ${t.card}`}>
                 <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${t.muted}`}>Total Spent</p>
                 <p className="text-[28px] font-black text-indigo-600 leading-tight">9.429.999 đ</p>
                 <p className={`text-xs font-medium mt-1 ${t.muted}`}>Across all groups</p>
               </div>
            </div>

            {/* YOUR GROUPS SECTION */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className={`text-lg font-bold ${t.text}`}>Your Groups</h2>
              <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {mockGroups.map((group) => (
                <motion.div 
                  key={group.id} 
                  whileHover={{ y: -4 }}
                  onClick={() => router.push(`/group/${group.id}`)} // Bấm vào là nhảy qua trang chi tiết nhóm
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 ${t.card} ${t.cardHover}`}
                >
                  <div className="flex items-start gap-4 mb-8">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${group.color}`}>
                      {getIcon(group.type)}
                    </div>
                    <div>
                      <h3 className={`font-bold text-base ${t.text}`}>{group.name}</h3>
                      <span className={`inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-semibold ${dark ? 'bg-slate-800 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                        {group.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between mb-3">
                    <p className={`text-xs font-medium ${t.muted}`}>{group.members} members</p>
                    <p className={`text-sm font-bold ${group.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {group.balance > 0 ? '+' : ''}{fmtVND(group.balance)}
                    </p>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${group.balance < 0 ? 'bg-rose-500' : group.balance > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} 
                      style={{ width: '100%' }}
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
               <p className={`text-sm italic ${t.muted}`}>Chưa có hoạt động mới gần đây...</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}