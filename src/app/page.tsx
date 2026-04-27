"use client";

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  Users, Plus, Trash2, Pencil, Check, X, ReceiptText,
  ArrowRight, RotateCcw, Wallet, Moon, Sun,
  CircleDollarSign, UserRound, Banknote, Sparkles,
  TrendingUp, Loader2, Coffee
} from "lucide-react";
import { Playfair_Display, DM_Sans } from "next/font/google";

const display = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── Business Logic ────────────────────────────────────────────────────────
function calculateOptimizedDebts(members: any[], expenses: any[]) {
  const balance: Record<string, number> = {};
  members.forEach((m) => (balance[m.id] = 0));
  expenses.forEach((exp) => {
    const splitCount = exp.splitBetween?.length || 1;
    const share = exp.amount / splitCount;
    exp.splitBetween?.forEach((id: string) => (balance[id] = (balance[id] || 0) - share));
    balance[exp.paidBy] = (balance[exp.paidBy] || 0) + exp.amount;
  });
  const creditors: any[] = [], debtors: any[] = [];
  Object.entries(balance).forEach(([id, bal]) => {
    if (bal > 1) creditors.push({ id, amount: bal });
    else if (bal < -1) debtors.push({ id, amount: -bal });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  const debts = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const min = Math.min(creditors[i].amount, debtors[j].amount);
    debts.push({ from: debtors[j].id, to: creditors[i].id, amount: Math.round(min) });
    creditors[i].amount -= min;
    debtors[j].amount -= min;
    if (creditors[i].amount < 1) i++;
    if (debtors[j].amount < 1) j++;
  }
  return debts;
}

// ─── Utils ───────────────────────────────────────────────────────────────────
const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";

const fmtInput = (val: string) => {
  const num = val.replace(/\D/g, "");
  return num ? new Intl.NumberFormat("vi-VN").format(parseInt(num)) : "";
};

const parseAmt = (s: string) => parseInt(String(s).replace(/\D/g, "")) || 0;

const initials = (n: string) => n ? n.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

const timeAgo = (ts: number) => {
  if (!ts) return "Vừa xong";
  const d = Date.now() - ts, m = Math.floor(d / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  return `${Math.floor(m / 60)} giờ trước`;
};

function useLS<T>(key: string, init: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [v, set] = useState<T>(() => {
    if (typeof window === "undefined") return init;
    try { const x = window.localStorage.getItem(key); return x ? JSON.parse(x) : init; }
    catch { return init; }
  });
  useEffect(() => { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { } }, [key, v]);
  return [v, set];
}

// ─── Design Tokens ───────────────────────────────────────────────────────────
const tokens = {
  light: {
    bg: "bg-[#faf7f2]", card: "bg-[#fffdf9] border-[#e8dfd0]", text: "text-[#3d2b1a]", 
    textMuted: "text-[#9c7d5e]", textFaint: "text-[#c4a882]", input: "bg-[#faf7f2] border-[#ddd0bc] text-[#3d2b1a] focus:border-[#f97316]",
    pill: "bg-[#faf7f2] border-[#e0d0bc] text-[#9c7d5e]", pillActive: "bg-[#f97316] text-white",
    tab: "bg-[#ede8e0]", tabActive: "bg-[#fffdf9] text-[#f97316]", tabInactive: "text-[#9c7d5e]",
    headerBg: "bg-[#3d2b1a]", confirmBtn: "border-[#e8dfd0] text-[#9c7d5e]", emptyBorder: "border-[#e8dfd0] bg-[#faf7f2]"
  },
  dark: {
    bg: "bg-[#1a1208]", card: "bg-[#221a0e] border-[#3d2b1a]", text: "text-[#f0e6d3]",
    textMuted: "text-[#a8865a]", textFaint: "text-[#6b4e2a]", input: "bg-[#1a1208] border-[#3d2b1a] text-[#f0e6d3] focus:border-[#f97316]",
    pill: "bg-[#221a0e] border-[#3d2b1a] text-[#a8865a]", pillActive: "bg-[#f97316] text-white",
    tab: "bg-[#1a1208]", tabActive: "bg-[#2d1f0f] text-[#fb923c]", tabInactive: "text-[#6b4e2a]",
    headerBg: "bg-[#0e0905]", confirmBtn: "border-[#3d2b1a] text-[#a8865a]", emptyBorder: "border-[#3d2b1a] bg-[#1a1208]"
  }
};

// ─── Base UI Components ───────────────────────────────────────────────────────
const Av = memo(({ name, size = 36 }: { name: string, size?: number }) => {
  const colors = [
    { bg: "#fde8d8", text: "#c2410c" }, { bg: "#fef3c7", text: "#b45309" },
    { bg: "#dcfce7", text: "#15803d" }, { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#ede9fe", text: "#7c3aed" }, { bg: "#fce7f3", text: "#be185d" },
    { bg: "#ccfbf1", text: "#0f766e" }, { bg: "#fff7ed", text: "#c2410c" },
  ];
  const safeName = name || "?"; // Fix lỗi sập nếu name chưa load kịp
  const c = colors[safeName.length % colors.length];
  return (
    <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
      style={{ width: size, height: size, background: c.bg, color: c.text, fontSize: size * 0.38, letterSpacing: "-0.02em" }}>
      {initials(safeName)}
    </div>
  );
});
Av.displayName = "Av";

function AnimNumber({ value }: { value: number }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current, end = value, dur = 500, t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(start + (end - start) * ease));
      if (p < 1) requestAnimationFrame(tick);
      else { setDisp(end); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{fmtVND(disp)}</span>;
}

const Card = memo(({ children, dark, className = "" }: { children: React.ReactNode, dark: boolean, className?: string }) => {
  const t = dark ? tokens.dark : tokens.light;
  return <div className={`rounded-2xl border shadow-sm p-5 ${t.card} ${className}`}>{children}</div>;
});
Card.displayName = "Card";

const SectionTitle = memo(({ icon, title, dark }: { icon: React.ReactNode, title: string, dark: boolean }) => {
  const t = dark ? tokens.dark : tokens.light;
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className={`${t.textMuted}`}>{icon}</span>
      <h2 className={`text-base font-bold tracking-tight ${t.text} ${display.className}`}>{title}</h2>
    </div>
  );
});
SectionTitle.displayName = "SectionTitle";

// ─── Modals ──────────────────────────────────────────────────────────────────
const Modal = memo(({ open, onClose, title, children, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={e => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border ${t.card}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-base font-bold ${t.text} ${display.className}`}>{title}</h3>
          <button onClick={onClose} className={`p-1.5 rounded-full ${t.pill} border`}><X size={14} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
});
Modal.displayName = "Modal";

const ConfirmModal = memo(({ open, onClose, onConfirm, title, message, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  return (
    <Modal open={open} onClose={onClose} title={title} dark={dark}>
      <p className={`text-sm mb-5 ${t.textMuted}`}>{message}</p>
      <div className="flex gap-2.5">
        <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl border ${t.confirmBtn}`}>Hủy</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold">Xác nhận</button>
      </div>
    </Modal>
  );
});
ConfirmModal.displayName = "ConfirmModal";

const EmptySlate = memo(({ icon, title, sub, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  return (
    <div className={`text-center py-10 rounded-2xl border-2 border-dashed ${t.emptyBorder}`}>
      <div className={`flex justify-center mb-3 ${t.textFaint}`}>{icon}</div>
      <div className={`font-bold text-sm mb-1 ${t.text}`}>{title}</div>
      <div className={`text-xs ${t.textMuted}`}>{sub}</div>
    </div>
  );
});
EmptySlate.displayName = "EmptySlate";

// ─── Component Các Khối Dữ Liệu ──────────────────────────────────────────────
const StatCards = memo(({ members, expenses, dark }: any) => {
  const total = useMemo(() => expenses.reduce((s: number, e: any) => s + e.amount, 0), [expenses]);
  const topSpender = useMemo(() => {
    if (!members.length) return null;
    const m: Record<string, number> = {}; members.forEach((x: any) => (m[x.id] = 0));
    expenses.forEach((e: any) => (m[e.paidBy] = (m[e.paidBy] || 0) + e.amount));
    const id = Object.entries(m).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0];
    return members.find((x: any) => x.id === id);
  }, [members, expenses]);

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {[
        { label: "Tổng chi", value: <AnimNumber value={total} />, icon: <CircleDollarSign size={15} /> },
        { label: "Thành viên", value: members.length, icon: <UserRound size={15} /> },
        { label: "Top chi", value: topSpender?.name?.split(" ").pop() || "—", icon: <TrendingUp size={15} /> },
      ].map((s, i) => (
        <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1 text-white/60 text-[10px] font-semibold uppercase mb-1.5">{s.icon} {s.label}</div>
          <div className="text-white font-bold text-sm truncate">{s.value}</div>
        </div>
      ))}
    </div>
  );
});
StatCards.displayName = "StatCards";

const MemberList = memo(({ members, onAdd, onRemove, onEdit, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [delTarget, setDelTarget] = useState<any>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  };

  const commitEdit = (id: string) => {
    if (!editName.trim()) return;
    onEdit(id, editName.trim());
    setEditId(null);
  };

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên thành viên…" className={`flex-1 rounded-xl px-4 h-12 outline-none border-2 text-sm ${t.input}`} />
        <button type="submit" className="h-12 px-5 rounded-xl bg-[#f97316] text-white font-bold text-sm flex items-center gap-2 shadow-md"><Plus size={16} /> Thêm</button>
      </form>
      {members.length === 0 ? <EmptySlate icon={<Users size={28} />} title="Chưa có thành viên" sub="Nhập tên để bắt đầu" dark={dark} /> : (
        <div className="flex flex-wrap gap-2">
          {members.map((m: any) => (
            <div key={m.id} className={`group flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border-2 transition-all ${t.card}`}>
              <Av name={m.name} size={28} />
              {editId === m.id ? (
                <div className="flex items-center gap-1">
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit(m.id)} className={`w-24 px-2 py-0.5 text-xs font-bold rounded outline-none border ${t.input}`} />
                  <button onClick={() => commitEdit(m.id)} className="p-1 text-emerald-600 bg-emerald-100 rounded-full"><Check size={12} /></button>
                  <button onClick={() => setEditId(null)} className="p-1 text-gray-600 bg-gray-100 rounded-full"><X size={12} /></button>
                </div>
              ) : (
                <>
                  <span className={`text-sm font-semibold ${t.text}`}>{m.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditId(m.id); setEditName(m.name); }} className={`p-1 rounded-full ${t.pill} border`}><Pencil size={11} /></button>
                    <button onClick={() => setDelTarget(m)} className="p-1 rounded-full text-rose-500 bg-rose-50 border border-rose-100"><Trash2 size={11} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmModal open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={() => onRemove(delTarget.id)} title="Xóa thành viên?" message={`Dữ liệu của ${delTarget?.name} sẽ mất sạch.`} dark={dark} />
    </div>
  );
});
MemberList.displayName = "MemberList";

const AddExpenseForm = memo(({ members, onAdd, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [split, setSplit] = useState<string[]>([]);

  const toggleSplit = (id: string) => setSplit(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAmt(amount);
    if (!title || !parsed || !payer || !split.length) return toast.error("Điền đủ thông tin!");
    onAdd({ title, amount: parsed, paidBy: payer, splitBetween: split });
    setTitle(""); setAmount(""); setSplit([]);
  };

  const perHead = split.length ? Math.round(parseAmt(amount) / split.length) : 0;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input placeholder="Mục chi tiêu…" value={title} onChange={e => setTitle(e.target.value)} className={`flex-1 rounded-xl px-4 h-12 border-2 ${t.input}`} />
        <input placeholder="Số tiền…" value={amount} onChange={e => setAmount(fmtInput(e.target.value))} className={`sm:w-40 rounded-xl px-4 h-12 border-2 text-right font-bold text-[#f97316] ${t.input}`} />
      </div>
      <div className={`p-4 rounded-xl border-2 ${t.card}`}>
        <p className="text-[10px] font-bold uppercase mb-2 text-[#9c7d5e]">Người trả tiền</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {members.map((m: any) => (
            <button key={m.id} type="button" onClick={() => setPayer(m.id)} className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-colors ${payer === m.id ? t.pillActive : t.pill}`}>{m.name}</button>
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase mb-2 text-[#9c7d5e]">Chia cho ai</p>
        <div className="flex flex-wrap gap-2">
          {members.map((m: any) => (
            <button key={m.id} type="button" onClick={() => toggleSplit(m.id)} className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-colors ${split.includes(m.id) ? 'bg-emerald-500 text-white border-emerald-500' : t.pill}`}>{m.name}</button>
          ))}
        </div>
        {perHead > 0 && <p className="mt-3 text-center text-xs font-bold text-[#f97316]">Mỗi người: {fmtVND(perHead)}</p>}
      </div>
      <button type="submit" className="h-12 bg-[#f97316] hover:bg-[#ea6c0a] transition-colors text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"><Plus size={16} /> Thêm Khoản Chi</button>
    </form>
  );
});
AddExpenseForm.displayName = "AddExpenseForm";

const ExpenseList = memo(({ expenses, members, onDelete, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const getName = (id: string) => members.find((m: any) => m.id === id)?.name || "?";
  if (!expenses.length) return <EmptySlate icon={<ReceiptText size={28} />} title="Trống trơn" sub="Chưa có giao dịch" dark={dark} />;
  return (
    <div className="flex flex-col gap-2.5">
      {[...expenses].reverse().map((exp: any) => (
        <div key={exp.id} className={`group flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-colors ${t.card}`}>
          <div className="flex-1">
            <p className={`font-bold text-sm ${t.text}`}>{exp.title}</p>
            <p className="text-[10px] text-[#9c7d5e]">{getName(exp.paidBy)} trả • {timeAgo(exp.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-[#f97316] text-sm">{fmtVND(exp.amount)}</p>
            <button onClick={() => onDelete(exp.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 mt-1"><Trash2 size={13} /></button>
          </div>
        </div>
      ))}
    </div>
  );
});
ExpenseList.displayName = "ExpenseList";

const Settlement = memo(({ members, expenses, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const debts = useMemo(() => calculateOptimizedDebts(members, expenses), [members, expenses]);
  const getName = (id: string) => members.find((m: any) => m.id === id)?.name || "?";
  if (!debts.length) return <div className="text-center py-10"><p className="text-4xl mb-2">🎉</p><p className={`font-bold ${t.text}`}>Hòa cả làng!</p></div>;
  return (
    <div className="flex flex-col gap-3">
      {debts.map((d: any, i: number) => (
        <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${t.card}`}>
          <div className="flex flex-col items-center w-14"><Av name={getName(d.from)} /><span className="text-[10px] font-bold mt-1 text-rose-500 truncate w-full text-center">{getName(d.from)}</span></div>
          <div className="flex-1 text-center">
            <p className="font-black text-[#f97316] mb-1">{fmtVND(d.amount)}</p>
            <ArrowRight size={14} className="mx-auto text-[#9c7d5e]" />
          </div>
          <div className="flex flex-col items-center w-14"><Av name={getName(d.to)} /><span className="text-[10px] font-bold mt-1 text-emerald-500 truncate w-full text-center">{getName(d.to)}</span></div>
        </div>
      ))}
    </div>
  );
});
Settlement.displayName = "Settlement";

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function SplitBillApp() {
  const [members, setMembers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [dark, setDark] = useLS("split_dark_v4", false);
  const [tab, setTab] = useState("expenses");
  const [resetOpen, setResetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  // Khởi tạo phòng
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      let g = params.get("g");
      if (!g) {
        g = Math.random().toString(36).substring(2, 9);
        window.history.replaceState(null, "", `?g=${g}`);
      }
      setGroupId(g);
    }
  }, []);

  // Fetch Data
useEffect(() => {
    if (!groupId || !isMounted) return;
    const loadData = async () => {
      try {
        const [mRes, eRes] = await Promise.all([
          fetch(`${API_URL}/members?groupId=${groupId}`),
          fetch(`${API_URL}/expenses?groupId=${groupId}`)
        ]);
        
        // Nếu Java báo lỗi 400, chặn ngay lập tức, không cho tính toán
        if (!mRes.ok || !eRes.ok) throw new Error("API Java đang báo lỗi 400");
        
        const m = await mRes.json();
        const e = await eRes.json();
        
        // Ép kiểu chắc chắn nó là Mảng ([]), nếu không phải thì cho rỗng
        setMembers(Array.isArray(m) ? m : []);
        setExpenses(Array.isArray(e) ? e : []);
        
      } catch (err) { 
        console.error("Lỗi kết nối:", err);
        // Fallback: Cho danh sách rỗng để web không bị sập
        setMembers([]);
        setExpenses([]);
      }
    };
    loadData();
  }, [groupId, isMounted, API_URL]);

  // Actions
  const addMember = useCallback(async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name, groupId }) 
      });
      const data = await res.json();
      setMembers(p => [...p, data]);
      toast.success("Đã thêm!");
    } catch { toast.error("Lỗi kết nối API!"); }
  }, [groupId, API_URL]);

  const editMember = useCallback((id: string, newName: string) => {
    // Cập nhật Optimistic trên UI (Vì Backend chưa có hàm PUT cập nhật)
    setMembers(p => p.map(m => m.id === id ? { ...m, name: newName } : m));
    toast.success("Đã lưu tên!");
  }, []);

  const addExpense = useCallback(async (exp: any) => {
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ ...exp, groupId }) 
      });
      const data = await res.json();
      setExpenses(p => [...p, data]);
      toast.success("Đã lưu khoản chi!");
    } catch { toast.error("Lỗi lưu chi tiêu!"); }
  }, [groupId, API_URL]);

  const removeMember = useCallback(async (id: string) => {
    const loadingToast = toast.loading("Đang xóa...");
    try {
      await fetch(`${API_URL}/members/${id}`, { method: "DELETE" });
      setMembers(p => p.filter(m => m.id !== id));
      toast.success("Xong!", { id: loadingToast });
    } catch { toast.error("Lỗi xóa!", { id: loadingToast }); }
  }, [API_URL]);

  const delExpense = useCallback(async (id: string) => {
    try {
      await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE" });
      setExpenses(p => p.filter(e => e.id !== id));
      toast.success("Đã xóa");
    } catch { toast.error("Lỗi xóa chi tiêu!"); }
  }, [API_URL]);

  const resetAll = useCallback(async () => {
    const loadingToast = toast.loading("Đang reset...");
    try {
      await fetch(`${API_URL}/members/reset?groupId=${groupId}`, { method: "DELETE" });
      setMembers([]); setExpenses([]); setResetOpen(false);
      toast.success("Đã làm mới phòng!", { id: loadingToast });
    } catch { toast.error("Lỗi Reset!", { id: loadingToast }); }
  }, [groupId, API_URL]);

if (!isMounted || !groupId) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf7f2] text-[#f97316]">
      <Loader2 size={32} className="animate-spin mb-4" />
      <p className="font-bold">Đang tạo phòng riêng cho Sếp...</p>
    </div>
  );
}
  const t = dark ? tokens.dark : tokens.light;

  return (
    <div className={`${body.className} min-h-screen ${t.bg} transition-colors duration-300`}>
      <Toaster position="top-center" />
      
      <div className={`${t.headerBg} pb-14 pt-8 text-white relative`}>
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className={`text-2xl font-black ${display.className}`}>Chia & Trả</h1>
              <p className="text-[10px] opacity-60">ID Phòng: {groupId}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDark(!dark)} className="p-2 bg-white/10 rounded-lg transition-colors hover:bg-white/20">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
              <button onClick={() => setResetOpen(true)} className="p-2 bg-white/10 rounded-lg transition-colors hover:bg-rose-500"><RotateCcw size={16} /></button>
            </div>
          </div>
          <StatCards members={members} expenses={expenses} dark={dark} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-12 flex flex-col gap-4">
        <Card dark={dark}>
          <SectionTitle icon={<Users size={16} />} title="Thành viên" dark={dark} />
          <MemberList members={members} onAdd={addMember} onRemove={removeMember} onEdit={editMember} dark={dark} />
        </Card>

        {members.length > 0 && (
          <Card dark={dark}>
            <SectionTitle icon={<Plus size={16} />} title="Chi tiêu mới" dark={dark} />
            <AddExpenseForm members={members} onAdd={addExpense} dark={dark} />
          </Card>
        )}

        <div className={`flex p-1 rounded-xl border-2 ${t.tab}`}>
          <button onClick={() => setTab("expenses")} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${tab === "expenses" ? t.tabActive : t.tabInactive}`}>Lịch sử giao dịch</button>
          <button onClick={() => setTab("settle")} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${tab === "settle" ? t.tabActive : t.tabInactive}`}>Chốt tiền (Tối ưu)</button>
        </div>

        <Card dark={dark}>
          {tab === "expenses" ? <ExpenseList expenses={expenses} members={members} onDelete={delExpense} dark={dark} /> : <Settlement members={members} expenses={expenses} dark={dark} />}
        </Card>
      </div>

      <ConfirmModal open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={resetAll} title="Xóa toàn bộ?" message="Tất cả thành viên và hóa đơn của phòng này sẽ biến mất vĩnh viễn. Hành động này không thể hoàn tác." dark={dark} />
    </div>
  );
}