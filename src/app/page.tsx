"use client";

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Trash2, Pencil, Check, X, ReceiptText,
  ArrowRight, RotateCcw, TrendingUp, Wallet, Moon, Sun,
  AlertTriangle, CircleDollarSign, UserRound, Banknote, Sparkles
} from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";

const font = Plus_Jakarta_Sans({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700", "800"] });

// ─── Business Logic ───────────────────────────────────────────────
function calculateOptimizedDebts(members: any[], expenses: any[]) {
  const balance: Record<string, number> = {};
  members.forEach((m) => (balance[m.id] = 0));
  expenses.forEach((exp) => {
    const share = exp.amount / exp.splitBetween.length;
    exp.splitBetween.forEach((id: string) => (balance[id] = (balance[id] || 0) - share));
    balance[exp.paidBy] = (balance[exp.paidBy] || 0) + exp.amount;
  });
  const creditors: any[] = [], debtors: any[] = [];
  Object.entries(balance).forEach(([id, bal]) => {
    if (bal > 0.01) creditors.push({ id, amount: bal });
    else if (bal < -0.01) debtors.push({ id, amount: -bal });
  });
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);
  const debts = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const min = Math.min(creditors[i].amount, debtors[j].amount);
    debts.push({ from: debtors[j].id, to: creditors[i].id, amount: Math.round(min * 100) / 100 });
    creditors[i].amount -= min;
    debtors[j].amount -= min;
    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }
  return debts;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  ["#4F46E5", "#EEF2FF"], ["#7C3AED", "#F5F3FF"], ["#DB2777", "#FDF2F8"],
  ["#D97706", "#FFFBEB"], ["#059669", "#ECFDF5"], ["#2563EB", "#EFF6FF"],
  ["#DC2626", "#FEF2F2"], ["#0D9488", "#F0FDFA"], ["#9333EA", "#FAF5FF"],
  ["#0891B2", "#ECFEFF"], ["#65A30D", "#F7FEE7"], ["#C2410C", "#FFF7ED"],
];

function hashColor(str: string) {
  if (!str) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[Math.abs(h)];
}

const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));
const parseAmt = (s: string) => parseFloat(String(s).replace(/[^\d.]/g, "")) || 0;
const fmtInput = (s: string) => {
  const n = parseFloat(String(s).replace(/[^\d.]/g, ""));
  return isNaN(n) ? s : n.toLocaleString("vi-VN");
};
const initials = (n: string) => n ? n.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
const timeAgo = (ts: number) => {
  if (!ts) return "Vừa xong";
  const d = Date.now() - ts, m = Math.floor(d / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
};

// ─── useLocalStorage (Chỉ còn dùng cho Dark Mode) ─────────────────────────────
function useLS<T>(key: string, init: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [v, set] = useState<T>(() => {
    if (typeof window === "undefined") return init;
    try { const x = window.localStorage.getItem(key); return x ? JSON.parse(x) : init; }
    catch { return init; }
  });
  useEffect(() => { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { } }, [key, v]);
  return [v, set];
}

// ─── Toast System ─────────────────────────────────────────────────────────────
let _sid = 0, _setT: any = null;
function useToasts() { const [t, s] = useState<any[]>([]); _setT = s; return t; }
function toast(msg: string, type = "info", ms = 3800) {
  if (!_setT) return;
  const id = ++_sid;
  _setT((p: any) => [...p, { id, msg, type }]);
  setTimeout(() => _setT((p: any) => p.filter((x: any) => x.id !== id)), ms);
}

const Toasts = memo(({ items, dark }: { items: any[], dark: boolean }) => (
  <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
    <AnimatePresence>
      {items.map(t => {
        const isErr = t.type === "error";
        const isWarn = t.type === "warning";
        const isSucc = t.type === "success";
        return (
          <motion.div key={t.id}
            initial={{ x: 64, opacity: 0, scale: 0.94 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 64, opacity: 0, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl min-w-[260px] border backdrop-blur-md font-semibold text-[13.5px]
              ${dark
                ? `bg-slate-800/90 text-slate-100 ${isErr ? 'border-red-900/50' : isSucc ? 'border-emerald-900/50' : 'border-slate-700'}`
                : `bg-white/90 text-slate-800 ${isErr ? 'border-red-100' : isSucc ? 'border-emerald-100' : 'border-slate-100'}`
              }`}
          >
            <span className={`flex-shrink-0 p-1 rounded-full ${isErr ? 'bg-red-100 text-red-600' : isWarn ? 'bg-amber-100 text-amber-600' : isSucc ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {isErr ? <X size={14} strokeWidth={3} /> : isWarn ? <AlertTriangle size={14} strokeWidth={3} /> : <Check size={14} strokeWidth={3} />}
            </span>
            {t.msg}
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
));
Toasts.displayName = "Toasts";

// ─── UI Components ────────────────────────────────────────────────────────────
const Avatar = memo(({ name, size = 36, ring = false }: { name: string, size?: number, ring?: boolean }) => {
  const [bg] = hashColor(name);
  return (
    <div className={`flex items-center justify-center rounded-full text-white font-extrabold flex-shrink-0 tracking-tighter ${ring ? 'ring-2 ring-white dark:ring-slate-900 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}>
      {initials(name)}
    </div>
  );
});
Avatar.displayName = "Avatar";

function AnimNumber({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current, end = value, dur = 600, t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisp(Math.round(start + (end - start) * ease));
      if (p < 1) requestAnimationFrame(tick);
      else { setDisp(end); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{fmtVND(disp)}{suffix}</>;
}

const Modal = memo(({ open, onClose, title, children, dark }: any) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) { document.addEventListener("keydown", h); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-sm rounded-[24px] p-6 shadow-2xl border ${dark ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-100'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h3>
              <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${dark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'}`}>
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
Modal.displayName = "Modal";

const ConfirmModal = memo(({ open, onClose, onConfirm, title, message, dark }: any) => (
  <Modal open={open} onClose={onClose} title={title} dark={dark}>
    <p className={`text-[14.5px] leading-relaxed mb-6 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{message}</p>
    <div className="flex justify-end gap-3">
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={onClose}
        className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition-colors ${dark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        Hủy bỏ
      </motion.button>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={() => { onConfirm(); onClose(); }}
        className="px-4 py-2.5 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-colors">
        Xác nhận
      </motion.button>
    </div>
  </Modal>
));
ConfirmModal.displayName = "ConfirmModal";

// ─── Feature Components ───────────────────────────────────────────────────────
const StatCards = memo(({ members, expenses, dark }: any) => {
  const total = useMemo(() => expenses.reduce((s: number, e: any) => s + e.amount, 0), [expenses]);
  const topSpender = useMemo(() => {
    if (!members.length) return null;
    const m: Record<string, number> = {}; members.forEach((x: any) => (m[x.id] = 0));
    expenses.forEach((e: any) => (m[e.paidBy] = (m[e.paidBy] || 0) + e.amount));
    const id = Object.entries(m).sort(([, a], [, b]) => b - a)[0]?.[0];
    return members.find((x: any) => x.id === id);
  }, [members, expenses]);

  const stats = [
    { label: "Tổng chi tiêu", val: total, isAmt: true, sub: `${expenses.length} giao dịch`, icon: <CircleDollarSign size={18} />, color: "text-indigo-500", bg: dark ? "bg-indigo-500/10" : "bg-indigo-50" },
    { label: "Thành viên", val: members.length, isAmt: false, sub: "trong nhóm", icon: <UserRound size={18} />, color: "text-emerald-500", bg: dark ? "bg-emerald-500/10" : "bg-emerald-50" },
    { label: "Top spender", val: topSpender?.name || "—", isAmt: false, sub: "trả nhiều nhất", icon: <TrendingUp size={18} />, color: "text-violet-500", bg: dark ? "bg-violet-500/10" : "bg-violet-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <motion.div key={s.label}
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
          className={`p-5 rounded-[20px] border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5
            ${dark ? 'bg-slate-800/40 border-slate-700/50 backdrop-blur-md' : 'bg-white border-slate-100'}`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight leading-none mb-1 break-words ${dark ? 'text-slate-50' : 'text-slate-900'}`}>
            {s.isAmt ? <AnimNumber value={s.val} suffix="đ" /> : s.val}
          </div>
          <div className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{s.sub}</div>
        </motion.div>
      ))}
    </div>
  );
});
StatCards.displayName = "StatCards";

const MemberList = memo(({ members, onAdd, onRemove, onEdit, dark }: any) => {
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [delTarget, setDelTarget] = useState<any>(null);

  const submit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim()); setName("");
  }, [name, onAdd]);

  const commitEdit = useCallback((id: string) => {
    if (!editName.trim()) return;
    onEdit(id, editName.trim()); setEditId(null); toast("Đã cập nhật tên", "success");
  }, [editName, onEdit]);

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2 mb-6">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên thành viên…"
          className={`flex-1 rounded-xl px-4 py-2.5 outline-none font-medium border transition-all focus:ring-2 focus:ring-indigo-500/20
            ${dark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white'}`}
        />
        <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-colors shadow-md">
          <Plus size={16} strokeWidth={2.5} /> Thêm
        </motion.button>
      </form>

      {members.length === 0 ? (
        <EmptySlate icon={<Users size={32} strokeWidth={1.5} />} title="Nhóm chưa có ai" sub="Thêm thành viên để bắt đầu quản lý chi tiêu" dark={dark} />
      ) : (
        <motion.div className="flex flex-wrap gap-2.5" layout>
          <AnimatePresence>
            {members.map((m: any) => (
              <motion.div key={m.id} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`group flex items-center gap-2 pr-2.5 p-1 rounded-full border transition-all hover:shadow-md cursor-default
                  ${dark ? 'bg-slate-800/40 border-slate-700 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
              >
                <Avatar name={m.name} size={30} />
                {editId === m.id ? (
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") commitEdit(m.id); if (e.key === "Escape") setEditId(null); }}
                    className={`w-24 px-2 py-1 text-[13px] font-bold rounded-md outline-none border focus:ring-2
                      ${dark ? 'bg-slate-900 border-slate-600 text-white focus:ring-indigo-500/30' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-indigo-500/20'}`}
                  />
                ) : (
                  <span className={`text-[14px] font-bold tracking-tight ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{m.name}</span>
                )}
                
                <div className="flex items-center gap-1 overflow-hidden w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-200 ease-out">
                  {editId === m.id ? (
                    <button onClick={() => commitEdit(m.id)} className="p-1.5 rounded-full text-emerald-600 bg-emerald-100 hover:bg-emerald-200 transition-colors"><Check size={12} strokeWidth={3} /></button>
                  ) : (
                    <button onClick={() => { setEditId(m.id); setEditName(m.name); }} className={`p-1.5 rounded-full transition-colors ${dark ? 'text-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/40' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}><Pencil size={12} strokeWidth={2.5} /></button>
                  )}
                  <button onClick={() => setDelTarget(m)} className={`p-1.5 rounded-full transition-colors ${dark ? 'text-rose-400 bg-rose-500/20 hover:bg-rose-500/40' : 'text-rose-600 bg-rose-50 hover:bg-rose-100'}`}><Trash2 size={12} strokeWidth={2.5} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <ConfirmModal open={!!delTarget} onClose={() => setDelTarget(null)}
        onConfirm={() => { onRemove(delTarget.id); toast(`Đã xóa ${delTarget.name}`, "info"); }}
        title="Xóa thành viên" dark={dark}
        message={`Xóa "${delTarget?.name}" và các khoản chi liên quan? Hành động này không thể hoàn tác.`} />
    </div>
  );
});
MemberList.displayName = "MemberList";

const AddExpenseForm = memo(({ members, onAdd, dark }: any) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [split, setSplit] = useState<string[]>([]);

  const toggleSplit = useCallback((id: string) => setSplit(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), []);
  const selAll = useCallback(() => setSplit(members.map((m: any) => m.id)), [members]);
  const clearAll = useCallback(() => setSplit([]), []);

  const submit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAmt(amount);
    if (!title.trim() || !parsed || !payer || !split.length) {
      toast("Vui lòng điền đầy đủ thông tin!", "error"); return;
    }
    onAdd({ title: title.trim(), amount: parsed, paidBy: payer, splitBetween: split });
    setTitle(""); setAmount(""); setSplit([]);
  }, [title, amount, payer, split, onAdd]);

  const perHead = split.length ? Math.round(parseAmt(amount) / split.length) : 0;
  const inputCls = `w-full rounded-xl px-4 py-3 outline-none font-semibold border transition-all focus:ring-2 focus:ring-indigo-500/20 ${dark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white'}`;
  const labelCls = `block text-xs font-bold uppercase tracking-wider mb-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelCls}>Mục chi tiêu</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Ăn tối, Taxi..." className={inputCls} />
        </div>
        <div className="w-[140px]">
          <label className={labelCls}>Số tiền (đ)</label>
          <input type="text" inputMode="numeric" value={amount}
            onChange={e => setAmount(e.target.value)} onBlur={e => setAmount(e.target.value ? fmtInput(e.target.value) : "")}
            placeholder="0" className={`${inputCls} text-right text-indigo-600 dark:text-indigo-400 font-black`} />
        </div>
      </div>

      <div className={`p-5 rounded-2xl border ${dark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50/50 border-slate-100'}`}>
        <label className={labelCls}>Người thanh toán</label>
        <div className="flex flex-wrap gap-2 mb-5">
          {members.map((m: any) => (
            <motion.button type="button" key={m.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={() => setPayer(m.id)}
              className={`flex items-center gap-2 pr-3 p-1 rounded-full text-[13.5px] font-bold border transition-colors
                ${payer === m.id ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20' : dark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <Avatar name={m.name} size={24} ring={payer === m.id} /> {m.name}
            </motion.button>
          ))}
        </div>

        <div className="flex justify-between items-center mb-3">
          <label className={`${labelCls} mb-0`}>Chia đều cho</label>
          <div className="flex gap-2">
            <button type="button" onClick={selAll} className={`text-[11.5px] font-bold px-2.5 py-1 rounded-md transition-colors ${dark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Tất cả</button>
            <button type="button" onClick={clearAll} className={`text-[11.5px] font-bold px-2.5 py-1 rounded-md transition-colors ${dark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Bỏ hết</button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {members.map((m: any) => {
            const sel = split.includes(m.id);
            return (
              <motion.label key={m.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                className={`flex items-center gap-2 pr-3 p-1 rounded-full text-[13.5px] font-bold border cursor-pointer transition-colors select-none
                  ${sel ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' : dark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <input type="checkbox" className="hidden" checked={sel} onChange={() => toggleSplit(m.id)} />
                <Avatar name={m.name} size={24} ring={sel} /> {m.name}
                {sel && perHead > 0 && <span className="text-[10px] font-bold opacity-80 ml-1 bg-white/20 px-1.5 py-0.5 rounded-md">{fmtVND(perHead)}đ</span>}
              </motion.label>
            );
          })}
        </div>
      </div>

      <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/30 rounded-xl px-5 py-3.5 font-bold flex items-center justify-center gap-2 transition-all mt-1">
        <Plus size={18} strokeWidth={2.5} /> Thêm Khoản Chi
      </motion.button>
    </form>
  );
});
AddExpenseForm.displayName = "AddExpenseForm";

const ExpenseList = memo(({ expenses, members, onDelete, dark }: any) => {
  const [del, setDel] = useState<any>(null);
  const getName = useCallback((id: string) => members.find((m: any) => m.id === id)?.name || "?", [members]);

  if (!expenses.length) return <EmptySlate icon={<ReceiptText size={36} strokeWidth={1.5} />} title="Chưa có giao dịch nào" sub="Lịch sử chi tiêu sẽ hiển thị ở đây" dark={dark} />;

  return (
    <motion.div className="flex flex-col gap-2.5" layout>
      <AnimatePresence>
        {[...expenses].reverse().map((exp: any, idx: number) => {
          const [ac] = hashColor(getName(exp.paidBy));
          return (
            <motion.div key={exp.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 30, delay: idx < 5 ? idx * 0.04 : 0 }}
              className={`group flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all hover:shadow-md
                ${dark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-slate-200'}`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ac + "1A", color: ac }}>
                <ReceiptText size={20} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-[15px] mb-0.5 truncate ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{exp.title}</div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className="px-1.5 py-0.5 rounded-md" style={{ backgroundColor: ac + "1A", color: ac }}>{getName(exp.paidBy)}</span>
                  <span className="opacity-40">•</span>
                  <span>Chia {exp.splitBetween?.length || 0}</span>
                  <span className="opacity-40">•</span>
                  <span className="font-medium">{timeAgo(exp.createdAt)}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-black text-[16px] tracking-tight ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>{fmtVND(exp.amount)}đ</div>
                <div className={`text-[11px] font-bold mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{fmtVND(Math.round(exp.amount / (exp.splitBetween?.length || 1)))}đ/người</div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setDel(exp)}
                className={`ml-1 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all
                  ${dark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}>
                <Trash2 size={14} strokeWidth={2.5} />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={() => { onDelete(del.id); }} title="Xóa giao dịch" dark={dark} message={`Bạn có chắc muốn xóa khoản "${del?.title}" (${fmtVND(del?.amount || 0)}đ) không?`} />
    </motion.div>
  );
});
ExpenseList.displayName = "ExpenseList";

const Settlement = memo(({ members, expenses, dark }: any) => {
  const debts = useMemo(() => calculateOptimizedDebts(members, expenses), [members, expenses]);
  const getName = useCallback((id: string) => members.find((m: any) => m.id === id)?.name || "?", [members]);

  if (!debts.length) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="text-5xl mb-4">🎉</motion.div>
      <div className={`text-lg font-black mb-1 ${dark ? 'text-slate-100' : 'text-slate-900'}`}>Hòa cả làng!</div>
      <div className={`text-sm font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Không ai nợ ai, một chuyến đi tuyệt vời.</div>
    </motion.div>
  );

  return (
    <motion.div className="flex flex-col gap-3" layout>
      <AnimatePresence>
        {debts.map((d: any, i: number) => {
          const fn = getName(d.from), tn = getName(d.to);
          return (
            <motion.div key={i} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 30 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border shadow-sm hover:shadow-md transition-shadow
                ${dark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-100'}`}
            >
              <div className="flex flex-col items-center min-w-[60px] gap-1.5">
                <Avatar name={fn} size={42} ring />
                <span className="text-[11px] font-bold text-rose-500 truncate w-[64px] text-center">{fn}</span>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <div className={`font-black text-lg tracking-tight mb-1.5 ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>{fmtVND(d.amount)}đ</div>
                <div className="flex items-center w-full max-w-[120px] gap-1.5">
                  <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-rose-400/50 to-indigo-500/50" />
                  <ArrowRight size={14} className="text-indigo-500" strokeWidth={3} />
                  <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-indigo-500/50 to-emerald-500/50" />
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Chuyển cho</div>
              </div>

              <div className="flex flex-col items-center min-w-[60px] gap-1.5">
                <Avatar name={tn} size={42} ring />
                <span className="text-[11px] font-bold text-emerald-500 truncate w-[64px] text-center">{tn}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
});
Settlement.displayName = "Settlement";

const EmptySlate = memo(({ icon, title, sub, dark }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-center py-10 rounded-2xl border-2 border-dashed ${dark ? 'border-slate-700/50 bg-slate-800/20' : 'border-slate-200 bg-slate-50/50'}`}>
    <div className={`flex justify-center mb-3 ${dark ? 'text-slate-600' : 'text-slate-300'}`}>{icon}</div>
    <div className={`font-bold text-[15px] mb-1 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{title}</div>
    <div className={`text-[13px] font-medium ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</div>
  </motion.div>
));
EmptySlate.displayName = "EmptySlate";

const Card = memo(({ title, icon, children, dark, accentClass = "text-indigo-500 bg-indigo-500/10" }: any) => (
  <div className={`rounded-[24px] p-6 shadow-xl border transition-colors ${dark ? 'bg-[#0f172a] border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/40'}`}>
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentClass}`}>
        {icon}
      </div>
      <h2 className={`text-[17px] font-extrabold tracking-tight ${dark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h2>
    </div>
    {children}
  </div>
));
Card.displayName = "Card";


// ─── Main App Page ────────────────────────────────────────────────────────────
export default function SplitBillApp() {
  
  // 1. STATE MANAGEMENT
  const [members, setMembers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dark, setDark] = useLS("split_dark_v3", false);
  const [tab, setTab] = useState("expenses");
  const [resetOpen, setResetOpen] = useState(false);
  const toasts = useToasts();
  const [isMounted, setIsMounted] = useState(false);

  // LƯU Ý: Thay vì hardcode cổng 8080, bạn có thể đổi thành 8081 nếu máy chủ Java của bạn đang chạy ở cổng 8081.
// Sau này khi có link backend từ Render/Railway, bạn chỉ cần thay vào đây
// Sửa dòng này (khoảng dòng 395)
const API_URL = "http://192.168.0.103:8080/api";

  // 2. FETCH DATA TỪ JAVA BACKEND
  useEffect(() => {
    setIsMounted(true);
    
    // Gọi API lấy Members
    fetch(`${API_URL}/members`)
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error("Lỗi kết nối Java API Members:", err));

    // Gọi API lấy Expenses
    fetch(`${API_URL}/expenses`)
      .then(res => res.json())
      .then(data => setExpenses(data))
      .catch(err => console.error("Lỗi kết nối Java API Expenses:", err));
  }, []);

  // 3. API CALLS (THÊM / SỬA / XÓA)
  
  // THÊM THÀNH VIÊN
  const addMember = useCallback(async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const newMember = await res.json();
      setMembers((p: any) => [...p, newMember]);
      toast("Đã lưu thành viên vào Database!", "success");
    } catch (error) {
      toast("Lỗi kết nối máy chủ Java!", "error");
    }
  }, [toasts]);

  // THÊM KHOẢN CHI
  const addExpense = useCallback(async (exp: any) => {
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exp)
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const newExpense = await res.json();
      setExpenses((p: any) => [...p, newExpense]);
      toast("Đã lưu khoản chi vào Database!", "success");
    } catch (error) {
      toast("Lỗi kết nối máy chủ Java!", "error");
    }
  }, [toasts]);

  // XÓA KHOẢN CHI
  const delExpense = useCallback(async (id: string) => {
    try {
      await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE" });
      setExpenses((p: any) => p.filter((e: any) => e.id !== id));
      toast("Đã xóa khoản chi khỏi Database", "info");
    } catch (error) {
      toast("Lỗi kết nối máy chủ Java!", "error");
    }
  }, [toasts]);

  // XÓA THÀNH VIÊN (Tạm thời xử lý trên giao diện, cần thêm API xóa Member trên Java sau)
  const removeMember = useCallback((id: string) => {
    setMembers((p: any) => p.filter((m: any) => m.id !== id));
    toast("Mẹo: Cần tạo thêm hàm Xóa bên Java!", "warning");
  }, [toasts]);

  // SỬA TÊN THÀNH VIÊN (Tạm thời xử lý trên giao diện)
  const editMember = useCallback((id: string, name: string) => {
    setMembers((p: any) => p.map((m: any) => m.id === id ? { ...m, name } : m));
  }, []);

  const resetAll = useCallback(() => { 
    toast("Mẹo: Cần tạo thêm hàm Reset bên Java!", "warning"); 
    setResetOpen(false);
  }, [toasts]);

  if (!isMounted) return null;

  return (
    <div className={`${font.className} min-h-screen transition-colors duration-300 ${dark ? "bg-[#0B1120] text-slate-200" : "bg-slate-50 text-slate-800"}`}>
      <Toasts items={toasts} dark={dark} />

      {/* Modern Fintech Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 pb-12 pt-8 rounded-b-[2.5rem] shadow-xl shadow-indigo-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-900/30 blur-3xl pointer-events-none" />

        <div className="max-w-[860px] mx-auto px-6 relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2.5 rounded-2xl shadow-lg">
                  <Wallet size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Chia & Trả</h1>
              </div>
              <p className="text-indigo-100/80 font-semibold text-sm">Quản lý tài chính nhóm thông minh</p>
            </div>

            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDark((d: boolean) => !d)}
                className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md text-white rounded-xl w-10 h-10 flex items-center justify-center transition-colors shadow-lg">
                {dark ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setResetOpen(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md text-white rounded-xl w-10 h-10 flex items-center justify-center transition-colors shadow-lg">
                <RotateCcw size={18} strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>
          <StatCards members={members} expenses={expenses} dark={dark} />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-[860px] mx-auto px-6 py-8 -mt-6 relative z-20 flex flex-col gap-6">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
          <Card title="Thành viên nhóm" icon={<Users size={20} strokeWidth={2.5} />} dark={dark} accentClass="text-indigo-500 bg-indigo-500/10">
            <MemberList members={members} onAdd={addMember} onRemove={removeMember} onEdit={editMember} dark={dark} />
          </Card>
        </motion.div>

        <AnimatePresence>
          {members.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Card title="Thêm khoản chi" icon={<Plus size={20} strokeWidth={2.5} />} dark={dark} accentClass="text-violet-500 bg-violet-500/10">
                <AddExpenseForm members={members} onAdd={addExpense} dark={dark} />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="pt-2">
          {/* iOS-style Tab Switcher */}
          <div className={`flex gap-1 p-1.5 rounded-[18px] mb-5 border shadow-sm ${dark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/50 border-slate-200/50'}`}>
            {[
              { key: "expenses", label: `Giao dịch (${expenses.length})`, icon: <ReceiptText size={16} strokeWidth={2.5} /> },
              { key: "settle", label: "Phương án chốt", icon: <Banknote size={16} strokeWidth={2.5} /> },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-300
                  ${tab === t.key 
                    ? (dark ? 'bg-slate-800 text-indigo-400 shadow-md' : 'bg-white text-indigo-600 shadow-md') 
                    : (dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "expenses" ? (
              <motion.div key="expenses" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                <Card title="Lịch sử giao dịch" icon={<ReceiptText size={20} strokeWidth={2.5} />} dark={dark} accentClass="text-pink-500 bg-pink-500/10">
                  <ExpenseList expenses={expenses} members={members} onDelete={delExpense} dark={dark} />
                </Card>
              </motion.div>
            ) : (
              <motion.div key="settle" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                <Card title="Phương án thanh toán tối ưu" icon={<Sparkles size={20} strokeWidth={2.5} />} dark={dark} accentClass="text-emerald-500 bg-emerald-500/10">
                  <Settlement members={members} expenses={expenses} dark={dark} />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <ConfirmModal open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={resetAll} title="Làm mới toàn bộ" dark={dark} message="Hành động này sẽ xóa hết toàn bộ thành viên và khoản chi đang có. Bạn có chắc chắn không?" />
    </div>
  );
}