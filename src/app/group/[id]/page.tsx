"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

// 🚀 NÂNG CẤP BỘ NHỚ LOCAL: Chống mất dữ liệu khi F5
function useLS<T>(key: string, init: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [v, set] = useState<T>(() => {
    if (typeof window === "undefined") return init;
    try { const x = window.localStorage.getItem(key); return x ? JSON.parse(x) : init; } catch { return init; }
  });
  useEffect(() => { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { } }, [key, v]);
  return [v, set];
}

// ─── IMPROVED DESIGN TOKENS ──────────────────────────────────────────────────
const tokens = {
  light: {
    bg: "bg-[#f8f9fc]", card: "bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]", cardHover: "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-slate-300/80",
    text: "text-slate-900", subText: "text-slate-500", muted: "text-slate-400", tab: "bg-slate-100/80", tabActive: "bg-white text-indigo-600 shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
    sidebar: "bg-white border-r border-slate-200/80", header: "bg-white/80 backdrop-blur-md border-b border-slate-200/80", input: "bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
    badge: "bg-slate-100 text-slate-600", navItem: "text-slate-600 hover:bg-slate-50 hover:text-slate-900", navActive: "bg-indigo-50 text-indigo-700", divider: "border-slate-200/60",
  },
  dark: {
    bg: "bg-[#0e1117]", card: "bg-[#161b27] border border-slate-700/50 shadow-[0_1px_3px_rgba(0,0,0,0.3)]", cardHover: "hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:border-slate-600/80",
    text: "text-slate-100", subText: "text-slate-400", muted: "text-slate-500", tab: "bg-slate-800/60", tabActive: "bg-slate-700/80 text-indigo-400 shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
    sidebar: "bg-[#0e1117] border-r border-slate-700/50", header: "bg-[#0e1117]/90 backdrop-blur-md border-b border-slate-700/50", input: "bg-slate-800/60 border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900/50",
    badge: "bg-slate-800 text-slate-400", navItem: "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200", navActive: "bg-indigo-950/50 text-indigo-400", divider: "border-slate-700/50",
  }
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (params?.id || params?.groupId) as string;

  // 🚀 LƯU TRỮ VĨNH CỬU
  const [members, setMembers] = useLS<Member[]>(`payshare_members_${groupId}`, []);
  const [expenses, setExpenses] = useLS<Expense[]>(`payshare_expenses_${groupId}`, []);
  
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

  const loadData = useCallback(async () => {
    if (!groupId || !isMounted) return;
    try {
      const [mRes, eRes] = await Promise.all([ 
          fetch(`${API_URL}/members/group/${groupId}`, { cache: 'no-store' }), 
          fetch(`${API_URL}/expenses/group/${groupId}`, { cache: 'no-store' }) 
      ]);
      if (mRes.ok) { 
        const data = await mRes.json();
        if(data.length > 0) setMembers(data); 
      }
      if (eRes.ok) { 
        const data = await eRes.json();
        if(data.length > 0) setExpenses(data); 
      }
    } catch {}
  }, [groupId, isMounted, API_URL, setMembers, setExpenses]);

  useEffect(() => {
    setIsMounted(true);
    const session = localStorage.getItem("user");
    if (session) { setUserName(JSON.parse(session).fullName || "Anh Kiệt"); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 🚀 THUẬT TOÁN CHỐT NỢ FRONTEND
  const serverDebts = useMemo(() => {
    const balances: Record<string, number> = {};
    members.forEach(m => balances[m.userId] = 0);

    expenses.forEach(exp => {
      if (!balances[exp.paidBy]) balances[exp.paidBy] = 0;
      balances[exp.paidBy] += exp.amount; 

      const splitCount = exp.splitBetween?.length || 1;
      const splitAmount = exp.amount / splitCount;
      
      exp.splitBetween.forEach(userId => {
        if (!balances[userId]) balances[userId] = 0;
        balances[userId] -= splitAmount; 
      });
    });

    const debtors: {userId: string, amount: number}[] = [];
    const creditors: {userId: string, amount: number}[] = [];

    Object.entries(balances).forEach(([userId, balance]) => {
      if (balance <= -1) debtors.push({ userId, amount: -balance });
      else if (balance >= 1) creditors.push({ userId, amount: balance });
    });

    const debts: DebtResponse[] = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const min = Math.min(debtor.amount, creditor.amount);

      debts.push({
        fromMemberId: debtor.userId,
        fromMemberName: members.find(m => m.userId === debtor.userId)?.name || "Ẩn danh",
        toMemberId: creditor.userId,
        toMemberName: members.find(m => m.userId === creditor.userId)?.name || "Ẩn danh",
        amount: min
      });

      debtor.amount -= min;
      creditor.amount -= min;

      if (debtor.amount < 1) i++;
      if (creditor.amount < 1) j++;
    }
    return debts;
  }, [expenses, members]);

  // 🚀 THUẬT TOÁN PHÂN TÍCH FRONTEND
  const stats = useMemo(() => {
    return members.map(m => {
      const spent = expenses.filter(e => e.paidBy === m.userId).reduce((sum, e) => sum + e.amount, 0);
      return { memberName: m.name, totalSpent: spent };
    }).filter(s => s.totalSpent > 0).sort((a,b) => b.totalSpent - a.totalSpent);
  }, [expenses, members]);

  // THÊM THÀNH VIÊN
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return toast.error("Vui lòng nhập tên!");
    setIsAddingMember(true);
    
    const tempId = `guest_${Date.now()}`;
    const newMember = { groupId, name: newMemberName, role: "MEMBER", userId: tempId };
    
    setMembers(prev => [...prev, newMember]);
    toast.success(`Đã mời ${newMemberName} vào nhóm!`); 
    setNewMemberName(""); 
    setIsAddMemberOpen(false);

    try {
      await fetch(`${API_URL}/members`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(newMember) 
      });
      loadData(); 
    } catch { toast.error("Lưu server thất bại, đang dùng bộ nhớ tạm!"); }
    finally { setIsAddingMember(false); }
  };

  // XÓA THÀNH VIÊN
  const handleDeleteMember = async (userId: string, memberName: string) => {
    if (!window.confirm(`Sếp có chắc chắn muốn XÓA "${memberName}" khỏi nhóm không?`)) return;

    // Cập nhật giao diện ngay lập tức
    setMembers(prev => prev.filter(m => m.userId !== userId));
    toast.success(`Đã tiễn ${memberName} khỏi nhóm!`);

    // Đồng bộ với server (NẾU API backend của Sếp hỗ trợ)
    try {
      await fetch(`${API_URL}/members/${userId}`, { method: "DELETE" });
      loadData();
    } catch {
      console.warn("Backend không phản hồi, chỉ xóa ở Local");
    }
  };

  // LƯU HÓA ĐƠN
  const handleSaveExpense = async (exp: Expense) => {
    const method = exp.id ? "PUT" : "POST";
    const url = exp.id ? `${API_URL}/expenses/${exp.id}` : `${API_URL}/expenses`;
    
    const tempExp = { ...exp, id: exp.id || `temp_${Date.now()}` };
    if (method === "POST") setExpenses(prev => [...prev, tempExp]);
    else setExpenses(prev => prev.map(e => e.id === exp.id ? tempExp : e));

    toast.success(exp.id ? "Đã cập nhật!" : "🎉 Đã ghi nhận hóa đơn mới!"); 
    setEditingExpense(null);
    setTab("settle"); // Tự động giật sang tab Chốt Nợ để xem chia tiền
    
    try {
      await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(exp) });
      loadData(); 
      return true;
    } catch { toast.error("Cảnh báo: Đang lưu offline do mạng yếu!"); return true; }
  };

  // XÓA HÓA ĐƠN
  const delExpense = async (id: string) => {
    if (!window.confirm("Xóa hóa đơn này?")) return;
    setExpenses(prev => prev.filter(e => e.id !== id)); 
    toast.success("Đã xóa!");
    try { await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE" }); loadData(); } catch {}
  };

  if (!isMounted) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Loader2 className="animate-spin text-white" size={20} />
        </div>
        <p className="text-sm text-slate-500 font-medium">Đang khởi tạo ứng dụng...</p>
      </div>
    </div>
  );

  const totalGroupSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const avatarColors = ["bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700"];

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${t.bg}`}>
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', fontWeight: 600, fontSize: '13px', padding: '12px 16px' }, success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } } }} />
      
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className={`w-[220px] hidden md:flex flex-col ${t.sidebar}`}>
        <div className="px-6 pt-7 pb-6">
          <button onClick={() => router.push('/dashboard')} className="block">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200/60"><span className="text-white font-black text-sm">P</span></div>
              <span className={`text-base font-black tracking-tight ${t.text}`}>PayShare</span>
            </div>
            <p className={`text-[10px] font-semibold mt-1 ml-10 uppercase tracking-widest ${t.muted}`}>Smart Split</p>
          </button>
        </div>

        <div className={`mx-4 border-t ${t.divider} mb-4`} />
        
        <nav className="flex-1 px-3 space-y-0.5">
          <p className={`text-[10px] font-bold uppercase tracking-widest px-3 mb-2 ${t.muted}`}>Bảng điều khiển</p>
          <button onClick={() => router.push('/dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${t.navItem}`}><LayoutDashboard size={16} className="opacity-70" /> Dashboard</button>
          <button onClick={() => setTab("expenses")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${tab === "expenses" ? t.navActive : t.navItem}`}><FolderKanban size={16} className="opacity-70" /> Lịch sử hóa đơn</button>
          <button onClick={() => setTab("settle")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${tab === "settle" ? t.navActive : t.navItem}`}><ArrowRight size={16} className="opacity-70" /> Chốt nợ nhóm</button>
          <button onClick={() => setTab("stats")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${tab === "stats" ? t.navActive : t.navItem}`}><BarChart2 size={16} className="opacity-70" /> Phân tích dữ liệu</button>
        </nav>

        <div className="p-3 space-y-1">
          <div className={`mx-1 border-t ${t.divider} mb-3`} />
          <div className={`flex p-1 rounded-lg ${dark ? 'bg-slate-800/60' : 'bg-slate-100/80'} mb-2`}>
            <button onClick={() => setDark(false)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${!dark ? 'bg-white shadow-sm text-indigo-600' : t.muted}`}><Sun size={12} /> Light</button>
            <button onClick={() => setDark(true)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${dark ? 'bg-slate-700 shadow-sm text-indigo-400' : t.muted}`}><Moon size={12} /> Dark</button>
          </div>
          <button onClick={() => { localStorage.removeItem("user"); router.push("/login"); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-rose-500 hover:bg-rose-50 ${dark ? 'hover:bg-rose-950/30' : ''}`}><LogOut size={15} className="opacity-70" /> Đăng xuất</button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className={`h-16 border-b flex items-center justify-between px-6 shrink-0 ${t.header}`}>
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => router.push("/dashboard")} className={`md:hidden p-2 rounded-lg transition-colors ${t.navItem}`}><ArrowLeft size={18} /></button>
            <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border w-full max-w-xs transition-colors ${t.input} ${dark ? 'text-slate-200' : 'text-slate-700'}`}><Search size={15} className={t.muted} /><input type="text" placeholder="Tìm kiếm khoản chi..." className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400" /></div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-right hidden sm:block`}>
              <p className={`text-sm font-bold leading-tight ${t.text}`}>{userName}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${t.muted}`}>Mã SV: 23663221</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-200/50">{initials(userName)}</div>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto ${t.bg}`}>
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto">

            <div className="mb-8 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1"><span className={`text-[11px] font-bold uppercase tracking-widest ${t.muted}`}>Quản lý chi tiêu</span></div>
                <h1 className={`text-2xl font-black tracking-tight ${t.text}`}>{groupId}</h1>
                <p className={`text-sm mt-1 ${t.subText}`}>Dữ liệu được lưu trữ an toàn trên thiết bị của bạn.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className={`p-5 rounded-2xl ${t.card} transition-all duration-200 ${t.cardHover}`}>
                <div className="flex items-center justify-between mb-4"><p className={`text-[11px] font-bold uppercase tracking-wider ${t.muted}`}>Trạng thái nợ</p><div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center"><TrendingUp size={14} /></div></div>
                <p className="text-2xl font-black text-rose-600 tabular-nums">{serverDebts.length}</p><p className={`text-xs font-medium mt-1 ${t.subText}`}>Giao dịch cần thanh toán</p>
              </div>
              <div className={`p-5 rounded-2xl ${t.card} transition-all duration-200 ${t.cardHover}`}>
                <div className="flex items-center justify-between mb-4"><p className={`text-[11px] font-bold uppercase tracking-wider ${t.muted}`}>Quy mô nhóm</p><div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><Users size={14} /></div></div>
                <p className={`text-2xl font-black tabular-nums ${t.text}`}>{members.length}</p><p className={`text-xs font-medium mt-1 ${t.subText}`}>Thành viên tham gia</p>
              </div>
              <div className={`p-5 rounded-2xl ${t.card} transition-all duration-200 ${t.cardHover}`}>
                <div className="flex items-center justify-between mb-4"><p className={`text-[11px] font-bold uppercase tracking-wider ${t.muted}`}>Tổng ngân sách</p><div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center"><DollarSign size={14} /></div></div>
                <p className="text-2xl font-black text-emerald-600 tabular-nums">{fmtVND(totalGroupSpent)}</p><p className={`text-xs font-medium mt-1 ${t.subText}`}>Tổng tiền đã chi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className={`p-6 rounded-2xl ${t.card}`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2"><Users size={16} className="text-indigo-500" /><h2 className={`text-sm font-bold ${t.text}`}>Thành viên nhóm</h2><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${t.badge}`}>{members.length}</span></div>
                    <button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 px-3 py-1.5 rounded-lg transition-colors"><UserPlus size={13} /> Thêm</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {members.length === 0 ? (
                      <div className={`w-full text-center py-6 rounded-xl border border-dashed ${dark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'} text-xs font-medium`}>Chưa có ai trong nhóm, thêm ngay Sếp ơi!</div>
                    ) : members.map((m, idx) => (
                      <div key={m.userId} className={`group flex items-center gap-2 py-1.5 pl-3 pr-1.5 rounded-full border ${dark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm transition-colors hover:border-rose-200 dark:hover:border-rose-900`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${avatarColors[idx % avatarColors.length]}`}>{initials(m.name)}</div>
                        <span className={`text-xs font-semibold ${t.text} whitespace-nowrap`}>{m.name}</span>
                        {/* NÚT XÓA THÀNH VIÊN Ở ĐÂY */}
                        <button 
                          onClick={() => handleDeleteMember(m.userId, m.name)} 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors ml-1"
                          title="Xóa thành viên"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-6 rounded-2xl transition-all duration-300 ${t.card} ${editingExpense ? `ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-100/50 ${dark ? 'shadow-indigo-900/20' : ''}` : ''}`}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${editingExpense ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>{editingExpense ? <Pencil size={13} /> : <Plus size={14} strokeWidth={2.5} />}</div>
                    <h2 className={`text-sm font-bold ${t.text}`}>{editingExpense ? "Chỉnh sửa hóa đơn" : "Ghi nhận khoản chi"}</h2>
                    {editingExpense && <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">Đang sửa</span>}
                  </div>
                  <AddExpenseForm members={members} onSave={handleSaveExpense} groupId={groupId} dark={dark} editData={editingExpense} onCancel={() => setEditingExpense(null)} t={t} />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div className={`flex p-1 rounded-xl ${dark ? 'bg-slate-800/60' : 'bg-slate-100/80'}`}>
                  {[
                    { key: "expenses", label: "Lịch sử hóa đơn" },
                    { key: "settle", label: "Bảng chốt nợ" },
                    { key: "stats", label: "Phân tích chi tiêu" },
                  ].map(item => (
                    <button 
                      key={item.key} onClick={() => setTab(item.key)} 
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 ${tab === item.key ? t.tabActive : `${t.muted} hover:text-slate-700 dark:hover:text-slate-300`}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="min-h-[300px]">
                    
                    {/* EXPENSES TAB */}
                    {tab === "expenses" && (
                      <div className="flex flex-col gap-3">
                        {expenses.length === 0 ? (
                          <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
                            <ReceiptText size={32} className={`mb-3 ${t.muted}`} />
                            <p className={`text-sm font-semibold ${t.subText}`}>Lịch sử trống</p>
                            <p className={`text-xs mt-1 ${t.muted}`}>Hãy nhập một khoản chi ở form bên trái.</p>
                          </div>
                        ) : [...expenses].reverse().map((exp, idx) => (
                          <motion.div key={exp.id || idx} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${t.card} ${t.cardHover}`}>
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0"><ReceiptText size={16} className="text-indigo-500" /></div>
                              <div className="min-w-0">
                                <p className={`font-semibold text-sm truncate mb-0.5 ${t.text}`}>{exp.description}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-indigo-600 font-black text-sm tabular-nums">{fmtVND(exp.amount)}</span>
                                  <span className={`text-xs ${t.muted}`}>·</span>
                                  <span className={`text-xs font-medium ${t.subText}`}>{members.find(m => m.userId === exp.paidBy)?.name || "Ẩn danh"} trả cho {exp.splitBetween?.length || 0} người</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 ml-3 shrink-0">
                              <button onClick={() => setEditingExpense(exp)} className={`p-2 rounded-lg transition-all text-indigo-400 ${dark ? 'hover:bg-indigo-950/60' : 'hover:bg-indigo-50'}`}><Pencil size={14} /></button>
                              <button onClick={() => exp.id && delExpense(exp.id)} className={`p-2 rounded-lg transition-all text-rose-400 ${dark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'}`}><Trash2 size={14} /></button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* SETTLE TAB */}
                    {tab === "settle" && (
                      <div className="flex flex-col gap-3">
                        {serverDebts.length === 0 ? (
                          <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${dark ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50/60 border-emerald-100'}`}>
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4"><Check size={24} className="text-emerald-600" strokeWidth={2.5} /></div>
                            <p className="text-emerald-700 dark:text-emerald-400 font-black text-base">Mọi người sòng phẳng!</p>
                            <p className={`text-xs mt-1 font-medium ${t.muted}`}>Không ai nợ ai cả 🎉</p>
                          </div>
                        ) : serverDebts.map((d, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`p-4 rounded-xl border ${t.card}`}>
                            <div className="flex items-center gap-3">
                              <div className={`flex-1 flex flex-col items-center py-3 rounded-xl ${dark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.muted}`}>Người nợ</p>
                                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs mb-1.5">{initials(d.fromMemberName)}</div>
                                <p className={`text-xs font-bold ${t.text}`}>{d.fromMemberName}</p>
                              </div>
                              <div className="flex flex-col items-center gap-1.5 px-1">
                                <p className="text-indigo-600 font-black text-lg tabular-nums">{fmtVND(d.amount)}</p>
                                <ArrowRight size={18} className={t.muted} />
                              </div>
                              <div className={`flex-1 flex flex-col items-center py-3 rounded-xl ${dark ? 'bg-emerald-950/30' : 'bg-emerald-50'}`}>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 text-emerald-500">Chủ nợ</p>
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs mb-1.5">{initials(d.toMemberName)}</div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{d.toMemberName}</p>
                              </div>
                              <button onClick={() => alert(`Sếp nhắc khéo ${d.fromMemberName} đi nhé!`)} className="p-2.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-colors ml-1 shrink-0"><ReceiptText size={16} /></button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* STATS TAB */}
                    {tab === "stats" && (
                      <div className={`p-6 rounded-2xl border ${t.card}`}>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2"><PieChartIcon size={16} className="text-indigo-500" /><h3 className={`text-sm font-bold ${t.text}`}>Người chi tiêu mạnh nhất</h3></div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${dark ? 'bg-indigo-950/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>Logic App</span>
                        </div>
                        
                        {stats.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12"><Loader2 size={24} className={`animate-spin mb-3 ${t.muted}`} /><p className={`text-sm ${t.muted}`}>Chưa có dữ liệu tính toán...</p></div>
                        ) : (
                          <div className="space-y-5">
                            {stats.map((s, i) => {
                              const pct = Math.round((s.totalSpent / (totalGroupSpent || 1)) * 100);
                              const barColors = ["bg-indigo-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];
                              return (
                                <div key={i}>
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${barColors[i % barColors.length]}`} />
                                      <span className={`text-sm font-semibold ${t.text}`}>{s.memberName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-medium tabular-nums ${t.subText}`}>{fmtVND(s.totalSpent)}</span>
                                      <span className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full ${dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{pct}%</span>
                                    </div>
                                  </div>
                                  <div className={`w-full h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }} className={`h-full rounded-full ${barColors[i % barColors.length]}`} />
                                  </div>
                                </div>
                              );
                            })}
                            <div className={`mt-6 pt-5 border-t ${t.divider} flex items-center justify-between`}><p className={`text-xs font-medium ${t.muted}`}>Tổng ngân sách lưu thông</p><p className={`text-sm font-black tabular-nums ${t.text}`}>{fmtVND(totalGroupSpent)}</p></div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── ADD MEMBER MODAL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setIsAddMemberOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 8 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl ${dark ? 'bg-[#161b27] border border-slate-700/50' : 'bg-white border border-slate-200/80'}`}>
              <div className="flex items-start justify-between mb-6">
                <div><h3 className={`text-lg font-black ${t.text}`}>Thêm thành viên</h3><p className={`text-xs font-medium mt-0.5 ${t.muted}`}>Nhập tên người bạn muốn thêm</p></div>
                <button onClick={() => setIsAddMemberOpen(false)} className={`p-2 rounded-lg transition-colors ${t.navItem}`}><X size={18}/></button>
              </div>
              <form onSubmit={handleAddMember} className="space-y-4">
                <input type="text" placeholder="Tên người bạn..." value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className={`w-full h-12 px-4 border-2 rounded-xl outline-none font-semibold text-sm transition-all ${t.input} ${dark ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-800 placeholder:text-slate-400'}`} required autoFocus />
                <button type="submit" disabled={isAddingMember} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200/50 dark:shadow-none flex items-center justify-center gap-2 transition-all">
                  {isAddingMember ? <><Loader2 className="animate-spin" size={18}/> Đang xử lý...</> : <><UserPlus size={16}/> Xác nhận thêm</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── COMPONENT: FORM HÓA ĐƠN ─────────────────────────────────────────────────
function AddExpenseForm({ members, onSave, groupId, editData, onCancel, t }: any) {
  const [desc, setDesc] = useState(""); 
  const [amount, setAmount] = useState(""); 
  const [payer, setPayer] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setDesc(editData.description); setAmount(editData.amount.toString()); setPayer(editData.paidBy); setSelectedIds(editData.splitBetween || members.map((m: any) => m.userId));
    } else {
      setDesc(""); setAmount(""); setPayer(""); setSelectedIds(members.map((m: any) => m.userId)); 
    }
  }, [editData, members]);

  const toggleAll = () => selectedIds.length === members.length ? setSelectedIds([]) : setSelectedIds(members.map((m: any) => m.userId));
  const toggleUser = (id: string) => selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(i => i !== id)) : setSelectedIds([...selectedIds, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if(!desc || !amount || !payer || selectedIds.length === 0) return toast.error("Nhập đủ thông tin nha Sếp!");
    
    setIsSubmitting(true);
    const success = await onSave({ id: editData?.id, description: desc, amount: parseAmt(amount), paidBy: payer, groupId, splitType: "EQUAL", splitBetween: selectedIds, createdAt: editData?.createdAt || Date.now() });
    setIsSubmitting(false);

    if (success && !editData) { setDesc(""); setAmount(""); }
  };

  const inputBase = `w-full px-4 border-2 rounded-xl outline-none font-semibold text-sm transition-all ${t?.input || 'bg-slate-50 border-slate-200 focus:border-indigo-400'} ${t?.text || 'text-slate-800'}`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input placeholder="VD: Lẩu bò sinh viên..." value={desc} onChange={e => setDesc(e.target.value)} disabled={isSubmitting} className={`${inputBase} h-11 placeholder:font-medium placeholder:text-slate-400`} />
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Số tiền" value={amount} onChange={e => setAmount(fmtInput(e.target.value))} disabled={isSubmitting} className={`${inputBase} h-11 text-indigo-600 font-black tabular-nums`} />
        <select value={payer} onChange={e => setPayer(e.target.value)} disabled={isSubmitting} className={`${inputBase} h-11 cursor-pointer`}>
          <option value="" disabled>Ai trả tiền?</option>
          {members.map((m: any) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
        </select>
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-center"><p className={`text-[11px] font-bold uppercase tracking-wider ${t?.muted || 'text-slate-400'}`}>Tham gia chia ({selectedIds.length}/{members.length})</p><button type="button" onClick={toggleAll} disabled={isSubmitting} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">{selectedIds.length === members.length ? "Bỏ chọn hết" : "Chọn tất cả"}</button></div>
        <div className="flex flex-wrap gap-2">
          {members.map((m: any) => (
            <button key={m.userId} type="button" disabled={isSubmitting} onClick={() => toggleUser(m.userId)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedIds.includes(m.userId) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200/50 dark:shadow-none' : `${t?.card || 'bg-slate-50 border-slate-200'} ${t?.subText || 'text-slate-500'} hover:border-indigo-300`} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>{m.name}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5 mt-2">
        {editData && <button type="button" onClick={onCancel} disabled={isSubmitting} className={`flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-wide transition-colors ${t?.badge || 'bg-slate-100 text-slate-500'} hover:bg-slate-200 dark:hover:bg-slate-700`}>Hủy</button>}
        <button type="submit" disabled={isSubmitting} className="flex-[2] h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-md shadow-indigo-200/50 dark:shadow-none flex items-center justify-center gap-2 transition-all">
          {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Đang xử lý...</> : <><Check size={15} strokeWidth={2.5} /> {editData ? "Cập nhật" : "Ghi nhận hóa đơn"}</>}
        </button>
      </div>
    </form>
  );
}