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
import { Inter } from "next/font/google";

// Đổi sang font Inter chuẩn Fintech hiện đại
const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

// ─── Business Logic ────────────────────────────────────────────────────────
function calculateOptimizedDebts(members: any[], expenses: any[]) {
  const balance: Record<string, number> = {};
  members.forEach((m) => (balance[m.id] = 0));
  expenses.forEach((exp) => {
    balance[exp.paidBy] = (balance[exp.paidBy] || 0) + exp.amount;
    if (exp.splitType === 'CUSTOM' && exp.customSplits) {
      Object.entries(exp.customSplits).forEach(([id, amt]: any) => {
        balance[id] = (balance[id] || 0) - amt;
      });
    } else {
      const splitCount = exp.splitBetween?.length || 1;
      const share = exp.amount / splitCount;
      exp.splitBetween?.forEach((id: string) => (balance[id] = (balance[id] || 0) - share));
    }
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

// ─── Design Tokens (Nâng cấp chuẩn Fintech Blue/Indigo) ──────────────────────
const tokens = {
  light: {
    bg: "bg-slate-50",
    card: "bg-white border-slate-200 shadow-sm",
    text: "text-slate-900",
    textMuted: "text-slate-500",
    textFaint: "text-slate-300",
    input: "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600",
    pill: "bg-white border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600",
    pillActive: "bg-indigo-600 border-indigo-600 text-white shadow-sm",
    tab: "bg-slate-100/80 p-1 border-slate-200",
    tabActive: "bg-white text-indigo-700 shadow-sm rounded-md",
    tabInactive: "text-slate-500 hover:text-slate-800",
    headerBg: "bg-indigo-600", // Màu xanh dương chuẩn hình Sếp gửi
    confirmBtn: "border-slate-200 text-slate-600 hover:bg-slate-50",
    emptyBorder: "border-slate-200 bg-slate-50"
  },
  dark: {
    bg: "bg-slate-950",
    card: "bg-slate-900 border-slate-800 shadow-sm",
    text: "text-white",
    textMuted: "text-slate-400",
    textFaint: "text-slate-600",
    input: "bg-slate-950 border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
    pill: "bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500 hover:text-indigo-400",
    pillActive: "bg-indigo-600 border-indigo-600 text-white shadow-sm",
    tab: "bg-slate-900 p-1 border-slate-800",
    tabActive: "bg-slate-800 text-indigo-400 shadow-sm rounded-md",
    tabInactive: "text-slate-500 hover:text-slate-300",
    headerBg: "bg-slate-950 border-b border-slate-800",
    confirmBtn: "border-slate-800 text-slate-400 hover:bg-slate-800",
    emptyBorder: "border-slate-800 bg-slate-900"
  }
};

// ─── Base UI Components ───────────────────────────────────────────────────────
const Av = memo(({ name, size = 36 }: { name: string, size?: number }) => {
  // Bảng màu Avatar cũng được đổi sang các tone lạnh/hiện đại
  const colors = [
    { bg: "#e0e7ff", text: "#4338ca" }, { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#cffafe", text: "#0f766e" }, { bg: "#f3e8ff", text: "#7e22ce" },
    { bg: "#fae8ff", text: "#a21caf" }, { bg: "#e2e8f0", text: "#334155" },
  ];
  const safeName = name || "?";
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
  return <div className={`rounded-2xl border ${t.card} ${className}`}>{children}</div>;
});
Card.displayName = "Card";

const SectionTitle = memo(({ icon, title, dark }: { icon: React.ReactNode, title: string, dark: boolean }) => {
  const t = dark ? tokens.dark : tokens.light;
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400">{icon}</div>
      <h2 className={`text-base font-bold tracking-tight ${t.text}`}>{title}</h2>
    </div>
  );
});
SectionTitle.displayName = "SectionTitle";

// ─── Modals ──────────────────────────────────────────────────────────────────
const Modal = memo(({ open, onClose, title, children, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={e => e.stopPropagation()}
        className={`w-full max-w-sm rounded-2xl p-5 shadow-xl border ${t.card}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-base font-bold ${t.text}`}>{title}</h3>
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
      <p className={`text-sm mb-6 ${t.textMuted}`}>{message}</p>
      <div className="flex gap-3">
        <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl border font-medium transition-colors ${t.confirmBtn}`}>Hủy</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 transition-colors text-white font-medium shadow-sm">Xác nhận</button>
      </div>
    </Modal>
  );
});
ConfirmModal.displayName = "ConfirmModal";

const EmptySlate = memo(({ icon, title, sub, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  return (
    <div className={`text-center py-10 rounded-xl border border-dashed ${t.emptyBorder}`}>
      <div className={`flex justify-center mb-3 ${t.textFaint}`}>{icon}</div>
      <div className={`font-semibold text-sm mb-1 ${t.text}`}>{title}</div>
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
    <div className="grid grid-cols-3 gap-3 mt-6">
      {[
        { label: "Tổng chi", value: <AnimNumber value={total} />, icon: <CircleDollarSign size={14} /> },
        { label: "Thành viên", value: members.length, icon: <UserRound size={14} /> },
        { label: "Top chi", value: topSpender?.name?.split(" ").pop() || "—", icon: <TrendingUp size={14} /> },
      ].map((s, i) => (
        <div key={s.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-indigo-100 text-[10px] font-medium uppercase tracking-wider mb-1.5">{s.icon} {s.label}</div>
          <div className="text-white font-bold text-sm truncate tracking-tight">{s.value}</div>
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
      <form onSubmit={submit} className="flex gap-2 mb-5">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên thành viên…" className={`flex-1 rounded-xl px-4 h-12 outline-none border transition-all ${t.input}`} />
        <button type="submit" className="h-12 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"><Plus size={16} /> Thêm</button>
      </form>
      {members.length === 0 ? <EmptySlate icon={<Users size={28} />} title="Chưa có thành viên" sub="Nhập tên để bắt đầu" dark={dark} /> : (
        <div className="flex flex-wrap gap-2.5">
          {members.map((m: any) => (
            <div key={m.id} className={`group flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition-all ${t.card} hover:border-indigo-300 hover:shadow-sm`}>
              <Av name={m.name} size={30} />
              {editId === m.id ? (
                <div className="flex items-center gap-1">
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit(m.id)} className={`w-24 px-2 py-0.5 text-xs font-medium rounded outline-none border ${t.input}`} />
                  <button onClick={() => commitEdit(m.id)} className="p-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"><Check size={12} /></button>
                  <button onClick={() => setEditId(null)} className="p-1 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><X size={12} /></button>
                </div>
              ) : (
                <>
                  <span className={`text-sm font-medium ${t.text}`}>{m.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button onClick={() => { setEditId(m.id); setEditName(m.name); }} className={`p-1.5 rounded-full ${t.pill} border transition-colors`}><Pencil size={11} /></button>
                    <button onClick={() => setDelTarget(m)} className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"><Trash2 size={11} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmModal open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={() => onRemove(delTarget.id)} title="Xóa thành viên?" message={`Dữ liệu của ${delTarget?.name} sẽ bị xóa khỏi hệ thống.`} dark={dark} />
    </div>
  );
});
MemberList.displayName = "MemberList";

const AddExpenseForm = memo(({ members, onAdd, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [splitMode, setSplitMode] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [split, setSplit] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const toggleSplit = (id: string) => setSplit(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleSelectAll = () => setSplit(split.length === members.length ? [] : members.map((m: any) => m.id));
  
  const parsedAmt = parseAmt(amount);
  const totalCustom = Object.values(customSplits).reduce((s, v) => s + parseAmt(v), 0);
  const remaining = parsedAmt - totalCustom;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !parsedAmt || !payer) return toast.error("Vui lòng điền đủ thông tin!");
    
    if (splitMode === "EQUAL" && !split.length) return toast.error("Chưa chọn người để chia!");
    if (splitMode === "CUSTOM" && remaining !== 0) return toast.error(`Tổng chia chưa khớp! Đang lệch ${fmtVND(Math.abs(remaining))}`);

    const customData: Record<string, number> = {};
    if (splitMode === "CUSTOM") {
      Object.entries(customSplits).forEach(([id, val]) => {
        if (parseAmt(val) > 0) customData[id] = parseAmt(val);
      });
    }

    onAdd({ 
      title, 
      amount: parsedAmt, 
      paidBy: payer, 
      splitType: splitMode,
      splitBetween: splitMode === "EQUAL" ? split : [],
      customSplits: splitMode === "CUSTOM" ? customData : null
    });
    
    setTitle(""); setAmount(""); setSplit([]); setCustomSplits({});
  };

  const perHead = split.length ? Math.round(parsedAmt / split.length) : 0;

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input placeholder="Mục chi tiêu (VD: Nhậu hải sản)..." value={title} onChange={e => setTitle(e.target.value)} className={`flex-1 rounded-xl px-4 h-12 border transition-all outline-none ${t.input}`} />
        <input placeholder="Tổng tiền..." value={amount} onChange={e => setAmount(fmtInput(e.target.value))} className={`sm:w-44 rounded-xl px-4 h-12 border outline-none text-right font-bold text-indigo-600 transition-all ${t.input}`} />
      </div>
      
      <div className={`p-5 rounded-xl border ${t.card}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${t.textMuted}`}>1. Người thanh toán</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {members.map((m: any) => (
            <button key={m.id} type="button" onClick={() => setPayer(m.id)} className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${payer === m.id ? t.pillActive : t.pill}`}>{m.name}</button>
          ))}
        </div>
        
        <p className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${t.textMuted}`}>2. Hình thức chia</p>
        <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-lg dark:bg-slate-800">
          <button type="button" onClick={() => setSplitMode("EQUAL")} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${splitMode === "EQUAL" ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>Chia Đều</button>
          <button type="button" onClick={() => setSplitMode("CUSTOM")} className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${splitMode === "CUSTOM" ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>Gõ Từng Người</button>
        </div>

        {splitMode === "EQUAL" ? (
          <motion.div initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}}>
            <div className="flex justify-between items-center mb-3">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.textMuted}`}>Danh sách chia</span>
              <button type="button" onClick={handleSelectAll} className="text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50">
                {split.length === members.length ? "Bỏ chọn tất cả" : "✓ Chọn tất cả"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((m: any) => (
                <button key={m.id} type="button" onClick={() => toggleSplit(m.id)} className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${split.includes(m.id) ? 'bg-indigo-600 text-white border-indigo-600' : t.pill}`}>{m.name}</button>
              ))}
            </div>
            {perHead > 0 && (
              <div className="mt-5 p-3 bg-indigo-50 rounded-xl text-center border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Mỗi người chịu: {fmtVND(perHead)}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}} className="flex flex-col gap-2.5 mt-2">
             <div className="flex justify-between items-center mb-1 text-[11px] font-semibold uppercase tracking-wider">
                <span className={t.textMuted}>Nhập số tiền</span>
                <span className={remaining === 0 ? "text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full" : remaining < 0 ? "text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full" : "text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full"}>
                  {remaining === 0 ? "✓ Đã khớp" : `Còn dư: ${fmtVND(remaining)}`}
                </span>
             </div>
             {members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50">
                  <span className={`text-sm font-medium pl-2 truncate w-1/3 ${t.text}`}>{m.name}</span>
                  <input 
                    placeholder="0đ" 
                    value={customSplits[m.id] || ""} 
                    onChange={e => setCustomSplits(p => ({...p, [m.id]: fmtInput(e.target.value)}))}
                    className="flex-1 max-w-[150px] text-right font-semibold text-indigo-600 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:bg-slate-900 dark:border-slate-700"
                  />
                </div>
             ))}
          </motion.div>
        )}
      </div>
      <button type="submit" className="h-12 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm"><Check size={18} /> Ghi nhận khoản chi</button>
    </form>
  );
});
AddExpenseForm.displayName = "AddExpenseForm";

const ExpenseList = memo(({ expenses, members, onDelete, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const getName = (id: string) => members.find((m: any) => m.id === id)?.name || "Thành viên đã xóa";
  
  if (!expenses.length) return <EmptySlate icon={<ReceiptText size={28} />} title="Chưa có giao dịch" sub="Các khoản chi sẽ hiển thị ở đây" dark={dark} />;
  
  return (
    <div className="flex flex-col gap-3">
      {[...expenses].reverse().map((exp: any) => (
        <div key={exp.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${t.card} hover:border-indigo-300 hover:shadow-sm`}>
          <div className="flex-1">
            <p className={`font-semibold text-sm mb-1 ${t.text}`}>{exp.title}</p>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 dark:bg-slate-800 dark:text-slate-300">{getName(exp.paidBy)}</span>
              <span>trả • {timeAgo(exp.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-indigo-600 text-[15px]">{fmtVND(exp.amount)}</p>
              {exp.splitType === 'CUSTOM' && <p className="text-[9px] font-medium text-indigo-400 uppercase mt-0.5 tracking-wider">Chia tùy chỉnh</p>}
            </div>
            <button 
              onClick={() => { if (window.confirm(`Xóa khoản chi "${exp.title}"?`)) onDelete(exp.id); }} 
              className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900"
            >
              <Trash2 size={16} />
            </button>
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
  const getName = (id: string) => members.find((m: any) => m.id === id)?.name || "Ai đó";
  
  if (!debts.length) return <div className="text-center py-12"><p className="text-4xl mb-3">🎉</p><p className={`font-semibold ${t.text}`}>Không ai nợ ai!</p><p className={`text-xs mt-1 ${t.textMuted}`}>Tuyệt vời, các khoản nợ đã được thanh toán.</p></div>;
  
  return (
    <div className="flex flex-col gap-3">
      {debts.map((d: any, i: number) => (
        <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${t.card}`}>
          <div className="flex flex-col items-center w-16">
            <Av name={getName(d.from)} />
            <span className="text-[10px] font-medium mt-1.5 text-slate-600 truncate w-full text-center dark:text-slate-400">{getName(d.from)}</span>
          </div>
          <div className="flex-1 text-center px-2">
            <div className="bg-indigo-50 rounded-lg py-2 px-1 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/50">
              <p className="font-bold text-indigo-600 mb-1 text-sm">{fmtVND(d.amount)}</p>
              <ArrowRight size={14} className="mx-auto text-indigo-400" />
            </div>
          </div>
          <div className="flex flex-col items-center w-16">
            <Av name={getName(d.to)} />
            <span className="text-[10px] font-medium mt-1.5 text-slate-600 truncate w-full text-center dark:text-slate-400">{getName(d.to)}</span>
          </div>
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
  const [dark, setDark] = useLS("payshare_dark", false);
  const [tab, setTab] = useState("expenses");
  const [resetOpen, setResetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

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

  useEffect(() => {
    if (!groupId || !isMounted) return;
    const loadData = async () => {
      try {
        const [mRes, eRes] = await Promise.all([
          fetch(`${API_URL}/members?groupId=${groupId}`),
          fetch(`${API_URL}/expenses?groupId=${groupId}`)
        ]);
        if (!mRes.ok || !eRes.ok) throw new Error("API đang báo lỗi");
        const m = await mRes.json();
        const e = await eRes.json();
        setMembers(Array.isArray(m) ? m : []);
        setExpenses(Array.isArray(e) ? e : []);
      } catch (err) { 
        console.error("Lỗi:", err);
      }
    };
    loadData();
  }, [groupId, isMounted, API_URL]);

  const addMember = useCallback(async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ name, groupId }) 
      });
      const data = await res.json();
      setMembers(p => [...p, data]);
      toast.success("Đã thêm thành viên!");
    } catch { toast.error("Lỗi kết nối!"); }
  }, [groupId, API_URL]);

  const editMember = useCallback((id: string, newName: string) => {
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
      toast.success("Ghi nhận thành công!");
    } catch { toast.error("Lỗi lưu hóa đơn!"); }
  }, [groupId, API_URL]);

  const removeMember = useCallback(async (id: string) => {
    const loadingToast = toast.loading("Đang xóa...");
    try {
      await fetch(`${API_URL}/members/${id}`, { method: "DELETE" });
      setMembers(p => p.filter(m => m.id !== id));
      toast.success("Đã xóa!", { id: loadingToast });
    } catch { toast.error("Lỗi xóa!", { id: loadingToast }); }
  }, [API_URL]);

  const delExpense = useCallback(async (id: string) => {
    try {
      await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE" });
      setExpenses(p => p.filter(e => e.id !== id));
      toast.success("Đã xóa hóa đơn");
    } catch { toast.error("Lỗi xóa!"); }
  }, [API_URL]);

  const resetAll = useCallback(async () => {
    const loadingToast = toast.loading("Đang dọn dẹp...");
    try {
      await fetch(`${API_URL}/members/reset?groupId=${groupId}`, { method: "DELETE" });
      setMembers([]); setExpenses([]); setResetOpen(false);
      toast.success("Đã làm mới nhóm!", { id: loadingToast });
    } catch { toast.error("Lỗi Reset!", { id: loadingToast }); }
  }, [groupId, API_URL]);

  if (!isMounted || !groupId) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-slate-50 text-indigo-600 ${sans.className}`}>
        <Loader2 size={36} className="animate-spin mb-4" />
        <p className="font-medium">Đang chuẩn bị không gian làm việc...</p>
      </div>
    );
  }
  
  const t = dark ? tokens.dark : tokens.light;

  return (
    <div className={`${sans.className} min-h-screen ${t.bg} transition-colors duration-300`}>
      <Toaster position="top-center" toastOptions={{className: 'text-sm font-medium'}} />
      
      {/* HEADER: Đã đổi sang màu nền chuẩn SaaS */}
      <div className={`${t.headerBg} pb-16 pt-8 text-white relative shadow-inner`}>
        <div className="max-w-xl mx-auto px-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight mb-1">PAYSHARE</h1>
              <button 
  onClick={() => window.location.href='/login'} 
  className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded font-bold transition-all"
>
  ĐĂNG NHẬP HỆ THỐNG →
</button>
              <p className="text-xs text-indigo-200 font-medium tracking-wide">ID NHÓM: <span className="text-white bg-white/10 px-1.5 py-0.5 rounded ml-1">{groupId}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDark(!dark)} className="p-2 bg-white/10 rounded-lg transition-colors hover:bg-white/20">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
              <button onClick={() => setResetOpen(true)} className="p-2 bg-white/10 rounded-lg transition-colors hover:bg-rose-500"><RotateCcw size={16} /></button>
            </div>
          </div>
          <StatCards members={members} expenses={expenses} dark={dark} />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 -mt-8 pb-16 flex flex-col gap-5">
        <Card dark={dark} className="shadow-md shadow-slate-200/50 dark:shadow-none">
          <SectionTitle icon={<Users size={16} strokeWidth={2.5} />} title="Quản lý thành viên" dark={dark} />
          <MemberList members={members} onAdd={addMember} onRemove={removeMember} onEdit={editMember} dark={dark} />
        </Card>

        {members.length > 0 && (
          <Card dark={dark} className="shadow-md shadow-slate-200/50 dark:shadow-none">
            <SectionTitle icon={<Plus size={16} strokeWidth={2.5} />} title="Thêm khoản chi" dark={dark} />
            <AddExpenseForm members={members} onAdd={addExpense} dark={dark} />
          </Card>
        )}

        <div className={`flex p-1.5 rounded-xl border ${t.tab}`}>
          <button onClick={() => setTab("expenses")} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${tab === "expenses" ? t.tabActive : t.tabInactive}`}>Lịch sử giao dịch</button>
          <button onClick={() => setTab("settle")} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${tab === "settle" ? t.tabActive : t.tabInactive}`}>Chốt nợ tối ưu</button>
        </div>

        <Card dark={dark} className="shadow-md shadow-slate-200/50 dark:shadow-none">
          {tab === "expenses" ? <ExpenseList expenses={expenses} members={members} onDelete={delExpense} dark={dark} /> : <Settlement members={members} expenses={expenses} dark={dark} />}
        </Card>
      </div>

      <ConfirmModal open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={resetAll} title="Xóa toàn bộ dữ liệu?" message="Tất cả thành viên và hóa đơn của nhóm này sẽ bị xóa vĩnh viễn khỏi hệ thống." dark={dark} />
    </div>
  );
}