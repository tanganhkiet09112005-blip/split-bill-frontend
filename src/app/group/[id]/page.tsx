"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import dynamic from 'next/dynamic'; 
import {
  Users, Plus, Trash2, Check, X, ReceiptText, Pencil,
  ArrowRight, Moon, Sun, Loader2, ArrowLeft, PieChart as PieChartIcon, 
  UserPlus, LayoutDashboard, FolderKanban, BarChart2, Bell, Search, LogOut, HelpCircle, User, TrendingUp, DollarSign
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// ─── DYNAMIC IMPORTS ────────────────────────────────────────────────────────
const StatDashboard = dynamic(() => import('@/components/StatDashboard'), { ssr: false, loading: () => <div className="h-[250px] bg-slate-100 flex items-center justify-center text-xs italic">Đang tải biểu đồ...</div>});

// ─── ĐỊNH NGHĨA KIỂU DỮ LIỆU ───────────────────────────────────────────────
interface Member { userId: string; name: string; groupId: string; }
interface Expense {
  id?: string; description: string; amount: number; paidBy: string; 
  groupId: string; splitType: string; splitBetween: string[]; 
  createdAt?: number;
}
interface DebtResponse { fromMemberId: string; fromMemberName: string; toMemberId: string; toMemberName: string; amount: number; }
interface StatData { memberName: string; totalSpent: number; }

// ─── UTILS ─────────────────────────────────────────────────────────
const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
const fmtInput = (v: string) => { const n = v.replace(/\D/g, ""); return n ? new Intl.NumberFormat("vi-VN").format(parseInt(n)) : ""; };
const parseAmt = (s: string) => parseInt(String(s).replace(/\D/g, "")) || 0;
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
  light: { bg: "bg-slate-50", card: "bg-white border-slate-200 shadow-sm", text: "text-slate-900", subText: "text-slate-500", tab: "bg-slate-100", tabActive: "bg-white text-indigo-600 shadow-sm" },
  dark: { bg: "bg-slate-950", card: "bg-slate-900 border-slate-800 shadow-sm", text: "text-white", subText: "text-slate-400", tab: "bg-slate-800", tabActive: "bg-slate-700 text-indigo-400 shadow-sm" }
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (params?.id || params?.groupId) as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [serverDebts, setServerDebts] = useState<DebtResponse[]>([]);
  const [stats, setStats] = useState<StatData[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [dark, setDark] = useLS("payshare_dark", false);
  const [tab, setTab] = useState("expenses");
  const [isMounted, setIsMounted] = useState(false);
  const [userName, setUserName] = useState("Anh Kiệt");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://split-bill-backend-5srl.onrender.com/api";
  const t = dark ? tokens.dark : tokens.light;

  const fetchSettlement = useCallback(async () => {
    if (!groupId) return;
    try { const res = await fetch(`${API_URL}/members/debts/${groupId}`); if (res.ok) setServerDebts(await res.json()); } catch {}
  }, [groupId, API_URL]);

  const fetchStats = useCallback(async () => {
    if (!groupId) return;
    try { const res = await fetch(`${API_URL}/expenses/stats/${groupId}`); if (res.ok) setStats(await res.json()); } catch {}
  }, [groupId, API_URL]);

  const loadData = useCallback(async () => {
    if (!groupId || !isMounted) return;
    try {
      const [mRes, eRes] = await Promise.all([ 
          fetch(`${API_URL}/members/group/${groupId}`), 
          fetch(`${API_URL}/expenses/group/${groupId}`) 
      ]);
      if (mRes.ok && eRes.ok) { 
        setMembers(await mRes.json()); 
        setExpenses(await eRes.json()); 
        fetchSettlement(); 
        fetchStats();
      }
    } catch {}
  }, [groupId, isMounted, API_URL, fetchSettlement, fetchStats]);

  useEffect(() => {
    setIsMounted(true);
    const session = localStorage.getItem("user");
    if (session) { setUserName(JSON.parse(session).fullName || "Anh Kiệt"); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return toast.error("Vui lòng nhập tên!");
    setIsAddingMember(true);
    try {
      const res = await fetch(`${API_URL}/members`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ groupId, name: newMemberName, role: "MEMBER", userId: `guest_${Date.now()}` }) 
      });
      if (res.ok) { 
        const savedMember = await res.json();
        setMembers(prev => [...prev, savedMember]);
        toast.success(`Đã mời ${newMemberName} vào nhóm!`); 
        setNewMemberName(""); 
        setIsAddMemberOpen(false); 
      }
    } catch { toast.error("Lỗi kết nối!"); }
    finally { setIsAddingMember(false); }
  };

  const handleSaveExpense = async (exp: Expense) => {
    const method = exp.id ? "PUT" : "POST";
    const url = exp.id ? `${API_URL}/expenses/${exp.id}` : `${API_URL}/expenses`;
    try {
      const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(exp) });
      if (res.ok) { 
        await loadData(); 
        toast.success(exp.id ? "Đã cập nhật!" : "🎉 Đã ghi nhận hóa đơn mới!"); 
        setEditingExpense(null);
        setTab("expenses"); // Chuyển về tab lịch sử sau khi lưu
        return true;
      }
      return false;
    } catch { toast.error("Lỗi mạng!"); return false; }
  };

  const delExpense = async (id: string) => {
    if (!window.confirm("Xóa hóa đơn này?")) return;
    try { const res = await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE" }); if (res.ok) { loadData(); toast.success("Đã xóa!"); } } catch { toast.error("Lỗi!"); }
  };

  if (!isMounted) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;

  const totalGroupSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className={`flex h-screen overflow-hidden ${t.bg}`}>
      <Toaster position="top-center" />
      
      {/* SIDEBAR BÊN TRÁI NHƯ ẢNH MẪU */}
      <aside className={`w-64 hidden md:flex flex-col border-r ${dark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-black italic text-indigo-600 tracking-tighter cursor-pointer" onClick={() => router.push('/dashboard')}>PayShare</h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Smart Bill Splitter</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => router.push('/dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setTab("expenses")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${tab === "expenses" ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <FolderKanban size={18} /> Chi tiết nhóm
          </button>
          <button onClick={() => { setTab("stats"); fetchStats(); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${tab === "stats" ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <BarChart2 size={18} /> Phân tích
          </button>
          
          <div className="pt-6">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-colors shadow-md">
              <Plus size={18} /> Nhóm mới
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className={`flex p-1 rounded-lg ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button onClick={() => setDark(false)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${!dark ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>
              <Sun size={14} /> Light
            </button>
            <button onClick={() => setDark(true)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${dark ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-500'}`}>
              <Moon size={14} /> Dark
            </button>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <HelpCircle size={18} /> Trợ giúp
          </button>
          <button onClick={() => { localStorage.removeItem("user"); router.push("/login"); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT BÊN PHẢI */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOPBAR */}
        <header className={`h-20 border-b flex items-center justify-between px-8 ${dark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => router.push("/dashboard")} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><ArrowLeft size={20} /></button>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border w-full max-w-md ${dark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Tìm kiếm khoản chi..." className="bg-transparent border-none outline-none w-full text-sm font-medium" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className={`text-xs font-black ${t.text}`}>{userName}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">IUH Analytics</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">
              {initials(userName)}
            </div>
          </div>
        </header>

        {/* NỘI DUNG CUỘN ĐƯỢC */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 ${t.bg}`}>
          
          <div className="mb-8">
            <h2 className={`text-2xl font-black mb-1 ${t.text}`}>Nhóm: {groupId}</h2>
            <p className={`text-sm ${t.subText}`}>Dữ liệu được đồng bộ trực tiếp từ hệ thống.</p>
          </div>

          {/* 3 THẺ THỐNG KÊ (Insight Doanh Nghiệp) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className={`p-6 rounded-2xl border ${t.card}`}>
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><TrendingUp size={16}/></div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái nợ</p>
               </div>
               <p className="text-2xl font-black text-rose-600">{serverDebts.length} Giao dịch</p>
             </div>
             <div className={`p-6 rounded-2xl border ${t.card}`}>
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Users size={16}/></div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quy mô nhóm</p>
               </div>
               <p className={`text-2xl font-black ${t.text}`}>{members.length} Thành viên</p>
             </div>
             <div className={`p-6 rounded-2xl border ${t.card}`}>
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={16}/></div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng ngân sách</p>
               </div>
               <p className="text-2xl font-black text-emerald-600">{fmtVND(totalGroupSpent)}</p>
             </div>
          </div>

          {/* LAYOUT 2 CỘT CHO DESKTOP */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* CỘT TRÁI (Form + Members) */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              
              {/* MEMBERS LIST */}
              <div className={`p-6 rounded-2xl border ${t.card}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-sm font-bold flex items-center gap-2 ${t.text}`}><Users size={18} className="text-indigo-600"/> Thành viên nhóm</h2>
                  <button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-1 text-[11px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"><UserPlus size={14} /> Thêm</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {members.length === 0 ? <p className="text-xs text-slate-400 italic">Chưa có ai...</p> : members.map(m => (
                    <div key={m.userId} className={`flex items-center gap-2 py-1.5 px-2 pr-4 rounded-full border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">{initials(m.name)}</div>
                      <span className={`text-xs font-bold ${t.text}`}>{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* EXPENSE FORM */}
              <div className={`p-6 rounded-2xl border ${t.card} border-2 ${editingExpense ? 'border-indigo-500 shadow-indigo-100 shadow-lg' : ''}`}>
                <h2 className={`text-sm font-bold flex items-center gap-2 ${t.text} mb-6`}>
                  {editingExpense ? <Pencil size={18} className="text-indigo-500" /> : <Plus size={18} className="text-indigo-600"/>} 
                  {editingExpense ? "Đang sửa hóa đơn" : "Khoản chi mới"}
                </h2>
                <AddExpenseForm 
                    members={members} 
                    onSave={handleSaveExpense} 
                    groupId={groupId} 
                    dark={dark} 
                    editData={editingExpense} 
                    onCancel={() => setEditingExpense(null)}
                  />
              </div>
            </div>

            {/* CỘT PHẢI (Tabs + List) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* TABS MENU */}
              <div className={`flex p-1.5 rounded-xl border ${t.card} ${t.tab}`}>
                <button onClick={() => setTab("expenses")} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${tab === "expenses" ? t.tabActive : "text-slate-500"}`}>Lịch sử hoạt động</button>
                <button onClick={() => { setTab("settle"); fetchSettlement(); }} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${tab === "settle" ? t.tabActive : "text-slate-500"}`}>Chốt nợ</button>
                <button onClick={() => { setTab("stats"); fetchStats(); }} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${tab === "stats" ? t.tabActive : "text-slate-500"}`}>Phân tích</button>
              </div>

              {/* TAB CONTENT */}
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-[300px]">
                  
                  {tab === "expenses" && (
                    <div className="flex flex-col gap-4">
                      {expenses.length === 0 ? <p className="text-center text-sm text-slate-400 py-10 italic">Chưa có giao dịch nào...</p> : 
                        [...expenses].reverse().map((exp, idx) => (
                          <div key={exp.id || idx} className={`flex items-center justify-between p-5 rounded-2xl border hover:shadow-md transition-shadow ${t.card}`}>
                            <div className="flex-1">
                              <p className={`font-bold text-base mb-1 ${t.text}`}>{exp.description}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-indigo-600 font-black text-sm">{fmtVND(exp.amount)}</span>
                                <span className={`text-xs font-medium ${t.subText}`}>• {members.find(m => m.userId === exp.paidBy)?.name || "Ẩn danh"} trả</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingExpense(exp)} className="p-2.5 text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition"><Pencil size={16} /></button>
                              <button onClick={() => exp.id && delExpense(exp.id)} className="p-2.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                  
                  {tab === "settle" && (
                      <div className="flex flex-col gap-4">
                        {serverDebts.length === 0 ? <div className={`text-center py-12 rounded-2xl border ${t.card} bg-emerald-50/30 border-emerald-100`}><p className="text-emerald-600 font-black text-lg uppercase">🎉 Sòng phẳng, không ai nợ ai!</p></div> : 
                          serverDebts.map((d, i) => (
                            <div key={i} className={`flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl border ${t.card} gap-6`}>
                              <div className="flex items-center w-full sm:w-auto justify-between flex-1 gap-4">
                                <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex-1">
                                  <span className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">Người nợ</span>
                                  <span className={`text-sm font-bold ${t.text}`}>{d.fromMemberName}</span>
                                </div>
                                <ArrowRight size={20} className="text-slate-300 flex-shrink-0" />
                                <div className="flex flex-col items-center bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl flex-1">
                                  <span className="text-[10px] text-emerald-400 font-black mb-1 uppercase tracking-widest">Chủ nợ</span>
                                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{d.toMemberName}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between w-full sm:w-auto gap-6 pl-6 sm:border-l border-slate-100 dark:border-slate-800">
                                <span className="text-indigo-600 font-black text-xl">{fmtVND(d.amount)}</span>
                                <button onClick={() => alert(`Đã gửi thông báo đòi tiền đến ${d.fromMemberName}`)} className="p-3 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition"><ReceiptText size={18} /></button>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                  )}

                  {tab === "stats" && (
                      <div className={`p-6 rounded-3xl border ${t.card}`}>
                          <div className="flex items-center justify-between mb-8">
                              <h3 className="font-black text-indigo-600 uppercase text-sm flex items-center gap-2"><PieChartIcon size={18}/> Biểu đồ đóng góp chi phí</h3>
                              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black italic">IUH Analytics Mode</div>
                          </div>
                          
                          {stats.length === 0 ? <p className="text-center py-10 italic text-slate-400">Đang tính toán số liệu...</p> : (
                              <div className="space-y-6">
                                  {stats.map((s, i) => (
                                      <div key={i}>
                                          <div className="flex justify-between text-xs font-bold mb-2">
                                              <span className={t.text}>{s.memberName}</span>
                                              <span className="text-indigo-600">{fmtVND(s.totalSpent)} ({Math.round((s.totalSpent / (totalGroupSpent || 1)) * 100)}%)</span>
                                          </div>
                                          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                              <motion.div 
                                                  initial={{ width: 0 }} 
                                                  animate={{ width: `${(s.totalSpent / (totalGroupSpent || 1)) * 100}%` }}
                                                  className="h-full bg-indigo-600 rounded-full"
                                              />
                                          </div>
                                      </div>
                                  ))}
                                  <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                                      <p className="text-[11px] text-slate-400 font-medium italic">"Phân tích này giúp điều phối dòng tiền công bằng hơn trong nhóm."</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL THÊM THÀNH VIÊN */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl border dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-indigo-600 italic">Thêm bạn mới</h3>
                <button onClick={() => setIsAddMemberOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleAddMember}>
                <input type="text" placeholder="Nhập tên người bạn..." value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full h-14 px-5 mb-6 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl outline-none focus:border-indigo-500 font-bold text-lg" required autoFocus />
                <button type="submit" disabled={isAddingMember} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center transition-colors">
                  {isAddingMember ? <Loader2 className="animate-spin" size={24}/> : "XÁC NHẬN THÊM"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── COMPONENT: FORM HÓA ĐƠN (ENTERPRISE LOGIC) ──────────────────────────────
function AddExpenseForm({ members, onSave, groupId, editData, onCancel }: any) {
  const [desc, setDesc] = useState(""); 
  const [amount, setAmount] = useState(""); 
  const [payer, setPayer] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setDesc(editData.description);
      setAmount(editData.amount.toString());
      setPayer(editData.paidBy);
      setSelectedIds(editData.splitBetween || members.map((m: any) => m.userId));
    } else {
      setDesc(""); setAmount(""); setPayer(""); 
      setSelectedIds(members.map((m: any) => m.userId)); 
    }
  }, [editData, members]);

  const toggleAll = () => {
    if (selectedIds.length === members.length) setSelectedIds([]);
    else setSelectedIds(members.map((m: any) => m.userId));
  };

  const toggleUser = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if(!desc || !amount || !payer || selectedIds.length === 0) return toast.error("Nhập đủ thông tin nha Sếp!");
    
    setIsSubmitting(true);
    const success = await onSave({ 
      id: editData?.id, 
      description: desc, 
      amount: parseAmt(amount), 
      paidBy: payer, 
      groupId, 
      splitType: "EQUAL", 
      splitBetween: selectedIds,
      createdAt: editData?.createdAt || Date.now()
    });
    setIsSubmitting(false);

    // Form tự động reset nếu lưu thành công
    if (success && !editData) {
      setDesc("");
      setAmount("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <input placeholder="Hôm nay chi việc gì?" value={desc} onChange={e => setDesc(e.target.value)} disabled={isSubmitting} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-700 dark:text-slate-200 transition-colors" />
      <div className="flex flex-col sm:flex-row gap-4">
        <input placeholder="Số tiền" value={amount} onChange={e => setAmount(fmtInput(e.target.value))} disabled={isSubmitting} className="w-full sm:w-1/2 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-black text-indigo-600 text-lg transition-colors" />
        <select value={payer} onChange={e => setPayer(e.target.value)} disabled={isSubmitting} className="w-full sm:w-1/2 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-600 dark:text-slate-300 cursor-pointer transition-colors">
          <option value="" disabled>Ai là người ứng tiền?</option>
          {members.map((m: any) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
        </select>
      </div>

      <div className="space-y-3 mt-2">
        <div className="flex justify-between items-center">
          <p className="text-xs font-black uppercase text-slate-400">Tham gia chia tiền ({selectedIds.length})</p>
          <button type="button" onClick={toggleAll} disabled={isSubmitting} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors">
            {selectedIds.length === members.length ? "Bỏ chọn hết" : "Chọn tất cả"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {members.map((m: any) => (
            <button key={m.userId} type="button" disabled={isSubmitting} onClick={() => toggleUser(m.userId)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedIds.includes(m.userId) ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        {editData && (
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 rounded-xl font-black text-sm uppercase transition-colors">Hủy sửa</button>
        )}
        <button type="submit" disabled={isSubmitting} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white h-14 rounded-xl font-black text-sm uppercase shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-colors">
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Check size={18} strokeWidth={4} />}
          {isSubmitting ? "ĐANG XỬ LÝ..." : editData ? "CẬP NHẬT THAY ĐỔI" : "GHI NHẬN HÓA ĐƠN"}
        </button>
      </div>
    </form>
  );
}