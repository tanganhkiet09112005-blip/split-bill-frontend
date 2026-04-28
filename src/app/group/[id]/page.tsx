"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import dynamic from 'next/dynamic'; 
import {
  Users, Plus, Trash2, Check, X, ReceiptText, Pencil,
  ArrowRight, Moon, Sun, Loader2, ArrowLeft, MapPin, PieChart as PieChartIcon, UserPlus
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// ─── DYNAMIC IMPORTS ────────────────────────────────────────────────────────
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false, loading: () => <div className="h-[200px] bg-slate-100 flex items-center justify-center text-xs italic">Đang tải bản đồ...</div>});
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="h-[250px] bg-slate-100 flex items-center justify-center text-xs italic">Đang tải vị trí...</div>});
const StatDashboard = dynamic(() => import('@/components/StatDashboard'), { ssr: false, loading: () => <div className="h-[250px] bg-slate-100 flex items-center justify-center text-xs italic">Đang tải biểu đồ...</div>});

// ─── ĐỊNH NGHĨA KIỂU DỮ LIỆU ───────────────────────────────────────────────
interface Member { userId: string; name: string; groupId: string; }
interface Expense {
  id?: string; description: string; amount: number; paidBy: string; 
  groupId: string; splitType: string; splitBetween: string[]; 
  latitude?: number | null; longitude?: number | null; createdAt?: number;
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
  light: { bg: "bg-slate-50", card: "bg-white border-slate-200 shadow-sm", text: "text-slate-900", subText: "text-slate-500", tab: "bg-slate-100", tabActive: "bg-white text-indigo-600 shadow-sm", header: "bg-indigo-600" },
  dark: { bg: "bg-slate-950", card: "bg-slate-900 border-slate-800 shadow-sm", text: "text-white", subText: "text-slate-400", tab: "bg-slate-800", tabActive: "bg-slate-700 text-indigo-400 shadow-sm", header: "bg-slate-900 border-b border-slate-800" }
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
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null); // QUAN TRỌNG: State sửa
  
  const [dark, setDark] = useLS("payshare_dark", false);
  const [tab, setTab] = useState("expenses");
  const [isMounted, setIsMounted] = useState(false);
  const [userName, setUserName] = useState("Sếp");
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
      }
    } catch {}
  }, [groupId, isMounted, API_URL, fetchSettlement]);

  useEffect(() => {
    setIsMounted(true);
    const session = localStorage.getItem("user");
    if (!session) { window.location.href = "/login"; } else { setUserName(JSON.parse(session).fullName || "Sếp"); }
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
      if (res.ok) { loadData(); toast.success("Đã thêm thành viên!"); setNewMemberName(""); setIsAddMemberOpen(false); }
    } catch { toast.error("Lỗi kết nối!"); }
    finally { setIsAddingMember(false); }
  };

  const handleSaveExpense = async (exp: Expense) => {
    const method = exp.id ? "PUT" : "POST";
    const url = exp.id ? `${API_URL}/expenses/${exp.id}` : `${API_URL}/expenses`;
    try {
      const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(exp) });
      if (res.ok) { 
        loadData(); 
        toast.success(exp.id ? "Đã cập nhật!" : "Đã ghi nhận!"); 
        setEditingExpense(null); // Thoát chế độ sửa
      }
    } catch { toast.error("Lỗi mạng!"); }
  };

  const delExpense = async (id: string) => {
    if (!window.confirm("Xóa hóa đơn này?")) return;
    try { const res = await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE" }); if (res.ok) { loadData(); toast.success("Đã xóa!"); } } catch { toast.error("Lỗi!"); }
  };

  if (!isMounted) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-300 pb-20`}>
      <Toaster position="top-center" />
      
      {/* HEADER */}
      <div className={`${t.header} pb-16 pt-6 text-white shadow-md px-4`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/dashboard")} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition"><ArrowLeft size={20} /></button>
              <div>
                <h1 className="text-2xl font-black italic tracking-tighter">PAYSHARE</h1>
                <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-widest">Hi {userName} • Nhóm {groupId}</p>
              </div>
            </div>
            <button onClick={() => setDark(!dark)} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center"><p className="text-[9px] text-indigo-100 font-bold uppercase mb-1">Tổng chi</p><p className="text-sm font-black truncate">{fmtVND(expenses.reduce((s, e) => s + e.amount, 0))}</p></div>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center"><p className="text-[9px] text-indigo-100 font-bold uppercase mb-1">Thành viên</p><p className="text-sm font-black">{members.length}</p></div>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center"><p className="text-[9px] text-emerald-200 font-bold uppercase mb-1">Chốt nợ</p><p className="text-sm font-black text-emerald-300">{serverDebts.length} GD</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 flex flex-col gap-5">
        
        {/* MEMBERS */}
        <div className={`p-5 rounded-2xl border ${t.card}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-bold flex items-center gap-2 ${t.text}`}><Users size={16} className="text-indigo-600"/> Thành viên</h2>
            <button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-1 text-[11px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"><UserPlus size={14} /> Thêm</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <div key={m.userId} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 py-1 px-1 pr-3 rounded-full border border-slate-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">{initials(m.name)}</div>
                <span className={`text-[11px] font-bold ${t.text}`}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* EXPENSE FORM (HỖ TRỢ EDIT & SELECT ALL) */}
        <div className={`p-5 rounded-2xl border ${t.card} border-2 ${editingExpense ? 'border-indigo-500 shadow-indigo-100 shadow-lg' : ''}`}>
           <h2 className={`text-sm font-bold flex items-center gap-2 ${t.text} mb-4`}>
             {editingExpense ? <Pencil size={16} className="text-indigo-500" /> : <Plus size={16} className="text-indigo-600"/>} 
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

        {/* TABS */}
        <div className={`flex p-1.5 rounded-xl border ${t.card} ${t.tab}`}>
          <button onClick={() => setTab("expenses")} className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase transition-all ${tab === "expenses" ? t.tabActive : "text-slate-500"}`}>Lịch sử</button>
          <button onClick={() => { setTab("settle"); fetchSettlement(); }} className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase transition-all ${tab === "settle" ? t.tabActive : "text-slate-500"}`}>Chốt nợ</button>
          <button onClick={() => { setTab("stats"); fetchStats(); }} className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase transition-all ${tab === "stats" ? t.tabActive : "text-slate-500"}`}>Thống kê</button>
        </div>

        {/* LIST */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="min-h-[200px]">
            {tab === "expenses" && (
              <div className="flex flex-col gap-3">
                {expenses.length === 0 ? <p className="text-center text-xs text-slate-400 py-10 italic">Chưa có dữ liệu...</p> : 
                  [...expenses].reverse().map((exp, idx) => (
                    <div key={exp.id || idx} className={`flex items-center justify-between p-4 rounded-2xl border ${t.card}`}>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${t.text}`}>{exp.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-indigo-600 font-black text-xs">{fmtVND(exp.amount)}</span>
                          <span className={`text-[10px] font-medium ${t.subText}`}>• {members.find(m => m.userId === exp.paidBy)?.name || "Ẩn danh"}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingExpense(exp)} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-xl transition"><Pencil size={14} /></button>
                        <button onClick={() => exp.id && delExpense(exp.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
            {/* Tab settle & stats... (giữ nguyên nợ nần & thống kê) */}
            {tab === "settle" && (
                <div className="flex flex-col gap-3">
                  {serverDebts.length === 0 ? <div className={`text-center py-10 rounded-2xl border ${t.card} bg-emerald-50/30 border-emerald-100`}><p className="text-emerald-600 font-black text-base uppercase">🎉 Đã sạch nợ!</p></div> : 
                    serverDebts.map((d, i) => (
                      <div key={i} className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border ${t.card} gap-4`}>
                        <div className="flex items-center w-full sm:w-auto justify-between flex-1 gap-2">
                          <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg flex-1">
                            <span className="text-[9px] text-slate-400 font-black mb-1">NGƯỜI NỢ</span>
                            <span className={`text-xs font-bold ${t.text}`}>{d.fromMemberName}</span>
                          </div>
                          <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />
                          <div className="flex flex-col items-center bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg flex-1">
                            <span className="text-[9px] text-emerald-400 font-black mb-1">CHỦ NỢ</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{d.toMemberName}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-4 sm:border-l border-slate-100 dark:border-slate-800">
                          <span className="text-indigo-600 font-black text-lg">{fmtVND(d.amount)}</span>
                          <button onClick={() => alert(`Gửi tin nhắn đòi ${d.fromMemberName} trả tiền nhé!`)} className="p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition"><ReceiptText size={16} /></button>
                        </div>
                      </div>
                    ))
                  }
                </div>
            )}
            {tab === "stats" && (
                <div className={`p-4 rounded-2xl border ${t.card}`}>
                  <div className="flex items-center justify-center gap-2 mb-4 text-indigo-600">
                    <PieChartIcon size={18} /> <span className="text-xs font-black uppercase">Phân tích chi tiêu</span>
                  </div>
                  <StatDashboard data={stats} />
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* MODAL THÊM MEMBER (giữ nguyên) */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-indigo-600 italic">Add Friend</h3>
                <button onClick={() => setIsAddMemberOpen(false)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full"><X size={18}/></button>
              </div>
              <form onSubmit={handleAddMember}>
                <input type="text" placeholder="Tên bạn..." value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full h-12 px-4 mb-5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl outline-none focus:border-indigo-500 font-bold" required autoFocus />
                <button type="submit" disabled={isAddingMember} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg flex items-center justify-center">
                  {isAddingMember ? <Loader2 className="animate-spin" size={20}/> : "XÁC NHẬN THÊM"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FORM HỖ TRỢ CHỌN TẤT CẢ & SỬA HÓA ĐƠN ──────────────────────────────────────
function AddExpenseForm({ members, onSave, groupId, dark, editData, onCancel }: any) {
  const [desc, setDesc] = useState(""); 
  const [amount, setAmount] = useState(""); 
  const [payer, setPayer] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null); 
  const [showMap, setShowMap] = useState(false);

  // LOGIC ĐỔ DỮ LIỆU KHI SỬA HOẶC RESET KHI THÊM MỚI
  useEffect(() => {
    if (editData) {
      setDesc(editData.description);
      setAmount(editData.amount.toString());
      setPayer(editData.paidBy);
      setSelectedIds(editData.splitBetween || members.map((m: any) => m.userId));
      setLocation(editData.latitude ? {lat: editData.latitude, lng: editData.longitude} : null);
    } else {
      setDesc(""); setAmount(""); setPayer(""); setLocation(null);
      setSelectedIds(members.map((m: any) => m.userId)); // Mặc định chọn tất cả
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    if(!desc || !amount || !payer || selectedIds.length === 0) return toast.error("Nhập đủ thông tin & chọn người chia nha Sếp!");
    
    onSave({ 
      id: editData?.id, // Có ID nghĩa là đang sửa
      description: desc, 
      amount: parseAmt(amount), 
      paidBy: payer, 
      groupId, 
      splitType: "EQUAL", 
      splitBetween: selectedIds,
      latitude: location?.lat, 
      longitude: location?.lng 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input placeholder="Hôm nay chi việc gì?" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-700 dark:text-slate-200" />
      <div className="flex flex-col sm:flex-row gap-3">
        <input placeholder="Số tiền" value={amount} onChange={e => setAmount(fmtInput(e.target.value))} className="w-full sm:w-1/2 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-black text-indigo-600 text-lg" />
        <select value={payer} onChange={e => setPayer(e.target.value)} className="w-full sm:w-1/2 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 font-bold text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
          <option value="" disabled>Ai trả tiền?</option>
          {members.map((m: any) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
        </select>
      </div>

      {/* CHỌN NGƯỜI CHIA TIỀN */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black uppercase text-slate-400">Chia cho ai? ({selectedIds.length})</p>
          <button type="button" onClick={toggleAll} className="text-[10px] font-bold text-indigo-500 hover:underline">
            {selectedIds.length === members.length ? "Bỏ chọn hết" : "Chọn tất cả"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m: any) => (
            <button key={m.userId} type="button" onClick={() => toggleUser(m.userId)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${selectedIds.includes(m.userId) ? 'bg-indigo-500 border-indigo-500 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-400'}`}>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        {editData && (
          <button type="button" onClick={onCancel} className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs">HỦY SỬA</button>
        )}
        <button type="submit" className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-black text-xs uppercase shadow-md flex items-center justify-center gap-2">
          <Check size={14} strokeWidth={4} /> {editData ? "CẬP NHẬT THAY ĐỔI" : "GHI NHẬN HÓA ĐƠN"}
        </button>
      </div>
    </form>
  );
}