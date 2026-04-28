"use client";

import { useState, useEffect, useCallback, memo, useRef } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import dynamic from 'next/dynamic'; 
import {
  Users, Plus, Trash2, Pencil, Check, X, ReceiptText,
  ArrowRight, RotateCcw, Moon, Sun,
  CircleDollarSign, UserRound, TrendingUp, Loader2, ArrowLeft, MapPin, PieChart as PieChartIcon
} from "lucide-react";

// ─── ĐỊNH NGHĨA KIỂU DỮ LIỆU ───────────────────────────────────────────────
interface Member { id: string; name: string; groupId: string; }
interface Expense {
  id?: string; title: string; amount: number; paidBy: string;
  groupId: string; splitType: string; splitBetween?: string[]; customSplits?: Record<string, number> | null;
  latitude?: number | null; longitude?: number | null; createdAt?: number;
}
interface DebtResponse { fromMemberId: string; fromMemberName: string; toMemberId: string; toMemberName: string; amount: number; }
interface StatData { memberName: string; totalSpent: number; }

// ─── DYNAMIC IMPORTS ────────────────────────────────────────────────────────
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false, loading: () => <div className="h-[250px] bg-slate-100 flex items-center justify-center text-xs italic">Đang tải bản đồ...</div>});
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="h-[300px] bg-slate-100 flex items-center justify-center text-xs italic">Đang tải vị trí...</div>});
const StatDashboard = dynamic(() => import('@/components/StatDashboard'), { ssr: false, loading: () => <div className="h-[300px] bg-slate-100 flex items-center justify-center text-xs italic">Đang tải biểu đồ...</div>});

// ─── UTILS & TOKENS ─────────────────────────────────────────────────────────
const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
const fmtInput = (v: string) => { const n = v.replace(/\D/g, ""); return n ? new Intl.NumberFormat("vi-VN").format(parseInt(n)) : ""; };
const parseAmt = (s: string) => parseInt(String(s).replace(/\D/g, "")) || 0;
const initials = (n: string) => n ? n.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
const timeAgo = (ts?: number) => {
  if (!ts) return "Vừa xong"; const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "Vừa xong"; return m < 60 ? `${m} phút trước` : `${Math.floor(m / 60)} giờ trước`;
};

function useLS<T>(key: string, init: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [v, set] = useState<T>(() => {
    if (typeof window === "undefined") return init;
    try { const x = window.localStorage.getItem(key); return x ? JSON.parse(x) : init; } catch { return init; }
  });
  useEffect(() => { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { } }, [key, v]);
  return [v, set];
}

const tokens = {
  light: { bg: "bg-slate-50", card: "bg-white border-slate-200 shadow-sm", text: "text-slate-900", tab: "bg-slate-100 border-slate-200", tabActive: "bg-white text-indigo-700 shadow-sm", tabInactive: "text-slate-500", headerBg: "bg-indigo-600" },
  dark: { bg: "bg-slate-950", card: "bg-slate-900 border-slate-800 shadow-sm", text: "text-white", tab: "bg-slate-900 border-slate-800", tabActive: "bg-slate-800 text-indigo-400 shadow-sm", tabInactive: "text-slate-500", headerBg: "bg-slate-950 border-b border-slate-800" }
};

// ─── BASE COMPONENTS ────────────────────────────────────────────────────────
const Av = memo(({ name, size = 36 }: { name: string, size?: number }) => {
  const colors = [{ bg: "#e0e7ff", text: "#4338ca" }, { bg: "#dbeafe", text: "#1d4ed8" }, { bg: "#cffafe", text: "#0f766e" }, { bg: "#f3e8ff", text: "#7e22ce" }, { bg: "#fae8ff", text: "#a21caf" }];
  const c = colors[(name || "?").length % colors.length];
  return <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold" style={{ width: size, height: size, background: c.bg, color: c.text, fontSize: size * 0.38 }}>{initials(name)}</div>;
});

const SectionTitle = memo(({ icon, title, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  return <div className="flex items-center gap-2 mb-4"><div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400">{icon}</div><h2 className={`text-base font-bold tracking-tight ${t.text}`}>{title}</h2></div>;
});

const Modal = memo(({ open, onClose, title, children, dark }: any) => {
  if (!open) return null; const t = dark ? tokens.dark : tokens.light;
  return <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}><motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={e => e.stopPropagation()} className={`w-full max-w-sm rounded-2xl p-5 shadow-xl border ${t.card}`}><div className="flex justify-between items-center mb-4"><h3 className={`text-base font-bold ${t.text}`}>{title}</h3><button onClick={onClose} className="p-1.5 rounded-full border bg-slate-50 text-slate-500 dark:bg-slate-800"><X size={14} /></button></div>{children}</motion.div></div>;
});

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function SplitBillApp({ params }: { params: { id: string } }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [serverDebts, setServerDebts] = useState<DebtResponse[]>([]);
  const [stats, setStats] = useState<StatData[]>([]);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  
  const groupId = params.id; 
  const [dark, setDark] = useLS("payshare_dark", false);
  const [tab, setTab] = useState("expenses");
  const [isMounted, setIsMounted] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [userName, setUserName] = useState("Sếp");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  // FETCH NỢ
  const fetchSettlement = useCallback(async () => {
    if (!groupId) return;
    try { const res = await fetch(`${API_URL}/members/${groupId}/settle`); if (res.ok) setServerDebts(await res.json()); } catch {}
  }, [groupId, API_URL]);

  // FETCH BIỂU ĐỒ
  const fetchStats = useCallback(async () => {
    if (!groupId) return;
    try { const res = await fetch(`${API_URL}/expenses/stats/${groupId}`); if (res.ok) setStats(await res.json()); } catch {}
  }, [groupId, API_URL]);

  // LOAD TỔNG
  const loadData = useCallback(async () => {
    if (!groupId || !isMounted || !isAuth) return;
    try {
      const [mRes, eRes] = await Promise.all([ fetch(`${API_URL}/members?groupId=${groupId}`), fetch(`${API_URL}/expenses?groupId=${groupId}`) ]);
      if (mRes.ok && eRes.ok) { setMembers(await mRes.json()); setExpenses(await eRes.json()); fetchSettlement(); fetchStats(); }
    } catch {}
  }, [groupId, isMounted, isAuth, API_URL, fetchSettlement, fetchStats]);

  useEffect(() => {
    setIsMounted(true);
    const session = localStorage.getItem("user_session");
    if (!session) { window.location.href = "/login"; } else { setIsAuth(true); setUserName(JSON.parse(session).fullName || "Sếp Kiệt"); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 🚀 HÀM NHẮC NỢ QUA EMAIL (MỚI TÍCH HỢP)
  const remindMember = async (targetEmail: string, fromName: string, amount: number) => {
    try {
      const res = await fetch(`${API_URL}/expenses/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, fromName, amount })
      });
      if (res.ok) {
        toast.success(`Đã bắn mail nhắc nợ tới ${targetEmail}!`);
      } else {
        toast.error("Gửi mail thất bại, check lại cấu hình server!");
      }
    } catch (error) {
      toast.error("Không kết nối được server!");
    }
  };

  // HÀM XỬ LÝ KHÁC
  const addMember = async (name: string) => {
    try { const res = await fetch(`${API_URL}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, groupId }) }); if (res.ok) { loadData(); toast.success("Đã thêm thành viên!"); } } catch { toast.error("Lỗi!"); }
  };
  const addExpense = async (exp: Expense) => {
    try { const res = await fetch(`${API_URL}/expenses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exp) }); if (res.ok) { loadData(); toast.success("Ghi nhận khoản chi!"); } } catch { toast.error("Lỗi!"); }
  };
  const delExpense = async (id: string) => {
    if (!window.confirm("Xóa khoản chi này?")) return;
    try { const res = await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE" }); if (res.ok) { loadData(); toast.success("Đã xóa!"); } } catch { toast.error("Lỗi!"); }
  };

  if (!isMounted || !groupId || !isAuth) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" /></div>;
  const t = dark ? tokens.dark : tokens.light;

  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-300 pb-20`}>
      <Toaster position="top-center" />
      
      {/* Header Section */}
      <div className={`${t.headerBg} pb-16 pt-8 text-white relative shadow-inner px-5`}>
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-start mb-6"> 
            <div>
              <div className="flex items-center gap-2 mb-1"><button onClick={() => window.location.href = "/"} className="p-1.5 bg-white/10 rounded-lg"><ArrowLeft size={16} /></button><h1 className="text-2xl font-black italic">PAYSHARE</h1></div>
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Hi, {userName} • Nhóm: {groupId}</p>
            </div>
            <button onClick={() => setDark(!dark)} className="p-2 bg-white/10 rounded-lg">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20"><p className="text-[9px] text-indigo-100 font-bold uppercase mb-1">Tổng chi</p><p className="text-sm font-black truncate">{fmtVND(expenses.reduce((s, e) => s + e.amount, 0))}</p></div>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20"><p className="text-[9px] text-indigo-100 font-bold uppercase mb-1">Thành viên</p><p className="text-sm font-black">{members.length}</p></div>
             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-emerald-300"><p className="text-[9px] text-emerald-100 font-bold uppercase mb-1">Chốt nợ</p><p className="text-sm font-black">{serverDebts.length} GD</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 -mt-8 flex flex-col gap-5">
        {/* Members Card */}
        <div className={`p-5 rounded-2xl border ${t.card}`}>
          <SectionTitle icon={<Users size={16} />} title="Thành viên" dark={dark} />
          <div className="flex flex-wrap gap-2">
            {members.map(m => (<div key={m.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 py-1 px-1 pr-3 rounded-full"><Av name={m.name} size={24} /><span className={`text-xs font-bold ${t.text}`}>{m.name}</span></div>))}
            <button onClick={() => { const n = prompt("Tên thành viên mới:"); if(n) addMember(n); }} className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Plus size={14} /></button>
          </div>
        </div>

        {/* Add Expense Card */}
        <div className={`p-5 rounded-2xl border ${t.card}`}>
           <SectionTitle icon={<Plus size={16} />} title="Khoản chi mới" dark={dark} />
           <AddExpenseForm members={members} onAdd={addExpense} dark={dark} groupId={groupId} />
        </div>

        {/* Tab Navigation */}
        <div className={`flex p-1.5 rounded-xl border ${t.tab}`}>
          <button onClick={() => setTab("expenses")} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${tab === "expenses" ? t.tabActive : t.tabInactive}`}>Lịch sử</button>
          <button onClick={() => setTab("settle")} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${tab === "settle" ? t.tabActive : t.tabInactive}`}>Chốt nợ</button>
          <button onClick={() => { setTab("stats"); fetchStats(); }} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase transition-all ${tab === "stats" ? t.tabActive : t.tabInactive}`}>Thống kê</button>
        </div>

        {/* Tab Content */}
        <div className={`p-4 rounded-2xl border ${t.card}`}>
          {tab === "expenses" && (
            <div className="flex flex-col gap-3">
              {expenses.length === 0 ? <p className="text-center text-xs text-slate-400 py-10 italic">Chưa có khoản chi nào...</p> : 
                [...expenses].reverse().map(exp => (
                  <div key={exp.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${t.text}`}>{exp.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-indigo-600 font-black text-xs">{fmtVND(exp.amount)}</span>
                        <span className="text-[10px] text-slate-400">• {timeAgo(exp.createdAt)}</span>
                        {exp.latitude && <button onClick={() => setViewingExpense(exp)} className="flex items-center gap-0.5 text-indigo-500 hover:text-indigo-700 font-black text-[10px] uppercase"><MapPin size={10} strokeWidth={3} /> Vị trí</button>}
                      </div>
                    </div>
                    <button onClick={() => exp.id && delExpense(exp.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                ))
              }
            </div>
          )}

          {/* 🎯 TAB CHỐT NỢ - NƠI TÍCH HỢP NÚT ĐÒI NỢ */}
          {tab === "settle" && (
            <div className="flex flex-col gap-3">
              {serverDebts.length === 0 ? <p className="text-center text-xs text-emerald-500 py-10 font-bold uppercase italic">🎉 Mọi người đã sạch nợ!</p> : 
                serverDebts.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                    <span className="text-[10px] font-black uppercase text-slate-500 w-16 truncate">{d.fromMemberName}</span>
                    <div className="flex flex-col items-center flex-1 mx-2">
                      <span className="text-indigo-600 font-black text-sm">{fmtVND(d.amount)}</span>
                      <div className="w-full flex items-center justify-center gap-1">
                        <div className="h-px bg-indigo-200 flex-1"></div>
                        <ArrowRight size={12} className="text-indigo-400" />
                        <div className="h-px bg-indigo-200 flex-1"></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500 w-16 truncate text-right">{d.toMemberName}</span>
                    
                    {/* NÚT ĐÒI NỢ QUA EMAIL */}
                    <button 
                      onClick={() => {
                        const email = prompt(`Nhập email của ${d.fromMemberName} để đòi nợ:`);
                        if(email) remindMember(email, d.toMemberName, d.amount);
                      }}
                      className="ml-3 p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-all flex-shrink-0"
                      title="Đòi nợ qua Email"
                    >
                      <ReceiptText size={16} />
                    </button>
                  </div>
                ))
              }
            </div>
          )}

          {tab === "stats" && (
            <div>
              <div className="flex items-center justify-center gap-2 mt-2 mb-2 text-indigo-600 dark:text-indigo-400">
                <PieChartIcon size={18} /> <span className="text-sm font-bold">Cơ cấu chi tiêu nhóm</span>
              </div>
              <StatDashboard data={stats} />
            </div>
          )}
        </div>
      </div>

      {/* Modal View Location */}
      <Modal open={!!viewingExpense} onClose={() => setViewingExpense(null)} title={`Địa điểm: ${viewingExpense?.title}`} dark={dark}>
        <div className="mb-4">
          {viewingExpense && viewingExpense.latitude != null && viewingExpense.longitude != null ? (
            <MapView latitude={viewingExpense.latitude as number} longitude={viewingExpense.longitude as number} />
          ) : (
             <div className="h-[200px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">Không có dữ liệu vị trí</div>
          )}
        </div>
        <button onClick={() => setViewingExpense(null)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg">ĐÓNG</button>
      </Modal>
    </div>
  );
}

// ─── FORM THÊM CHI TIÊU ─────────────────────────────────────────────────────
function AddExpenseForm({ members, onAdd, dark, groupId }: { members: Member[], onAdd: (e: Expense) => void, dark: boolean, groupId: string }) {
  const [title, setTitle] = useState(""); const [amount, setAmount] = useState(""); const [payer, setPayer] = useState("");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null); const [showMap, setShowMap] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if(!title || !amount || !payer) return toast.error("Vui lòng nhập đủ thông tin!");
    onAdd({ title, amount: parseAmt(amount), paidBy: payer, groupId, splitType: "EQUAL", splitBetween: members.map(m => m.id), latitude: location?.lat, longitude: location?.lng });
    setTitle(""); setAmount(""); setLocation(null); setShowMap(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input placeholder="Bạn đã chi vào việc gì?" value={title} onChange={e => setTitle(e.target.value)} className="p-3.5 border rounded-xl outline-none dark:bg-slate-900 text-sm font-medium" />
      <input placeholder="Số tiền (VND)" value={amount} onChange={e => setAmount(fmtInput(e.target.value))} className="p-3.5 border rounded-xl outline-none dark:bg-slate-900 font-black text-indigo-600 text-lg" />
      <select value={payer} onChange={e => setPayer(e.target.value)} className="p-3.5 border rounded-xl outline-none dark:bg-slate-900 text-sm font-bold text-slate-600">
        <option value="">Ai là người thanh toán?</option>
        {members.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
      </select>
      <button type="button" onClick={() => setShowMap(!showMap)} className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-2 rounded-lg border w-max ${location ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}><MapPin size={12} /> {location ? "📍 Đã gắn vị trí" : "Gắn vị trí quán ăn"}</button>
      {showMap && <div className="mt-1"><MapPicker onLocationSelect={(lat, lng) => setLocation({lat, lng})} /></div>}
      <button type="submit" className="bg-indigo-600 text-white p-4 rounded-xl font-black text-sm mt-2 flex items-center justify-center gap-2"><Check size={16} /> GHI NHẬN HÓA ĐƠN</button>
    </form>
  );
}