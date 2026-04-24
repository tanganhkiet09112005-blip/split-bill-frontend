"use client";

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  Users, Plus, Trash2, Pencil, Check, X, ReceiptText,
  ArrowRight, RotateCcw, Wallet, Moon, Sun,
  AlertTriangle, CircleDollarSign, UserRound, Banknote, Sparkles,
  TrendingUp, Loader2, Coffee
} from "lucide-react";
import { Playfair_Display, DM_Sans } from "next/font/google";

const display = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// ─── Business Logic (KHÔNG THAY ĐỔI) ────────────────────────────────────────
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

// ─── Utils ───────────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  ["#c2410c", "#fff7ed"], ["#b45309", "#fffbeb"], ["#a16207", "#fefce8"],
  ["#15803d", "#f0fdf4"], ["#0369a1", "#f0f9ff"], ["#7c3aed", "#faf5ff"],
  ["#be185d", "#fdf2f8"], ["#0f766e", "#f0fdfa"], ["#c2410c", "#fff7ed"],
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
    bg: "bg-[#faf7f2]",
    card: "bg-[#fffdf9] border-[#e8dfd0]",
    cardHover: "hover:border-[#d4c4a8]",
    text: "text-[#3d2b1a]",
    textMuted: "text-[#9c7d5e]",
    textFaint: "text-[#c4a882]",
    input: "bg-[#faf7f2] border-[#ddd0bc] text-[#3d2b1a] placeholder-[#c4a882] focus:border-[#f97316] focus:bg-white",
    pill: "bg-[#faf7f2] border-[#e0d0bc] text-[#9c7d5e] hover:border-[#f97316] hover:text-[#f97316]",
    pillActive: "bg-[#f97316] border-[#f97316] text-white",
    tab: "bg-[#ede8e0] border-[#ddd0bc]",
    tabActive: "bg-[#fffdf9] text-[#f97316] shadow-sm border border-[#e8dfd0]",
    tabInactive: "text-[#9c7d5e] hover:text-[#3d2b1a]",
    divider: "border-[#e8dfd0]",
    badge: "bg-[#fff3e0] text-[#c05a00]",
    headerBg: "bg-[#3d2b1a]",
    emptyBorder: "border-[#e8dfd0] bg-[#faf7f2]",
    confirmBtn: "border-[#e8dfd0] text-[#9c7d5e] hover:bg-[#faf7f2]",
    btnGhost: "bg-white/10 border-white/20 text-white hover:bg-white/20",
  },
  dark: {
    bg: "bg-[#1a1208]",
    card: "bg-[#221a0e] border-[#3d2b1a]",
    cardHover: "hover:border-[#5c3d1e]",
    text: "text-[#f0e6d3]",
    textMuted: "text-[#a8865a]",
    textFaint: "text-[#6b4e2a]",
    input: "bg-[#1a1208] border-[#3d2b1a] text-[#f0e6d3] placeholder-[#6b4e2a] focus:border-[#f97316] focus:bg-[#221a0e]",
    pill: "bg-[#221a0e] border-[#3d2b1a] text-[#a8865a] hover:border-[#f97316] hover:text-[#f97316]",
    pillActive: "bg-[#f97316] border-[#f97316] text-white",
    tab: "bg-[#1a1208] border-[#3d2b1a]",
    tabActive: "bg-[#2d1f0f] text-[#fb923c] shadow-sm border border-[#5c3d1e]",
    tabInactive: "text-[#6b4e2a] hover:text-[#a8865a]",
    divider: "border-[#3d2b1a]",
    badge: "bg-[#3d1f00] text-[#fb923c]",
    headerBg: "bg-[#0e0905]",
    emptyBorder: "border-[#3d2b1a] bg-[#1a1208]",
    confirmBtn: "border-[#3d2b1a] text-[#a8865a] hover:bg-[#2d1f0f]",
    btnGhost: "bg-white/10 border-white/20 text-white hover:bg-white/20",
  }
};

// ─── Base UI Components ───────────────────────────────────────────────────────

const Avatar = memo(({ name, size = 36, ring = false }: { name: string, size?: number, ring?: boolean }) => {
  const [bg, fg] = hashColor(name);
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${ring ? 'ring-2 ring-white/40' : ''}`}
      style={{ width: size, height: size, background: bg, color: bg, fontSize: size * 0.38, letterSpacing: "-0.02em" }}
    >
      <span style={{ color: fg === "#fff7ed" || fg === "#fffbeb" || fg === "#fefce8" || fg === "#f0fdf4" || fg === "#f0f9ff" || fg === "#faf5ff" || fg === "#fdf2f8" || fg === "#f0fdfa" ? bg.replace("c2410c", "7c1d06").replace("b45309", "713f12").replace("a16207", "713f12").replace("15803d", "14532d").replace("0369a1", "0c4a6e").replace("7c3aed", "4c1d95").replace("be185d", "831843").replace("0f766e", "134e4a") : "#ffffff" }}>
        {initials(name)}
      </span>
    </div>
  );
});
Avatar.displayName = "Avatar";

// Simplified avatar that just uses bg correctly
const Av = memo(({ name, size = 36 }: { name: string, size?: number }) => {
  const colors = [
    { bg: "#fde8d8", text: "#c2410c" },
    { bg: "#fef3c7", text: "#b45309" },
    { bg: "#dcfce7", text: "#15803d" },
    { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#ede9fe", text: "#7c3aed" },
    { bg: "#fce7f3", text: "#be185d" },
    { bg: "#ccfbf1", text: "#0f766e" },
    { bg: "#fff7ed", text: "#c2410c" },
  ];
  let h = 0;
  if (name) for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  const c = colors[Math.abs(h)];
  return (
    <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
      style={{ width: size, height: size, background: c.bg, color: c.text, fontSize: size * 0.38, letterSpacing: "-0.02em" }}>
      {initials(name)}
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
  return <>{fmtVND(disp)}đ</>;
}

// ─── Shared Styled Components ─────────────────────────────────────────────────

const Card = memo(({ children, dark, className = "" }: { children: React.ReactNode, dark: boolean, className?: string }) => {
  const t = dark ? tokens.dark : tokens.light;
  return (
    <div className={`rounded-2xl border shadow-sm p-5 ${t.card} ${className}`}>
      {children}
    </div>
  );
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

const Spinner = () => <Loader2 size={16} className="animate-spin" />;

// ─── Modal ───────────────────────────────────────────────────────────────────

const Modal = memo(({ open, onClose, title, children, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) { document.addEventListener("keydown", h); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl border ${t.card}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-base font-bold ${t.text} ${display.className}`}>{title}</h3>
              <button onClick={onClose} className={`p-1.5 rounded-full ${t.pill} border transition-colors`} aria-label="Đóng">
                <X size={14} strokeWidth={2.5} />
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

const ConfirmModal = memo(({ open, onClose, onConfirm, title, message, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  return (
    <Modal open={open} onClose={onClose} title={title} dark={dark}>
      <p className={`text-sm leading-relaxed mb-5 ${t.textMuted}`}>{message}</p>
      <div className="flex gap-2.5">
        <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${t.confirmBtn}`}>
          Hủy bỏ
        </button>
        <button onClick={() => { onConfirm(); onClose(); }}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white transition-colors">
          Xác nhận
        </button>
      </div>
    </Modal>
  );
});
ConfirmModal.displayName = "ConfirmModal";

// ─── EmptySlate ───────────────────────────────────────────────────────────────

const EmptySlate = memo(({ icon, title, sub, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  return (
    <div className={`text-center py-10 rounded-2xl border-2 border-dashed ${t.emptyBorder}`}>
      <div className={`flex justify-center mb-3 ${t.textFaint}`}>{icon}</div>
      <div className={`font-bold text-sm mb-1 ${t.text}`}>{title}</div>
      <div className={`text-xs font-medium ${t.textMuted}`}>{sub}</div>
    </div>
  );
});
EmptySlate.displayName = "EmptySlate";

// ─── StatCards ───────────────────────────────────────────────────────────────

const StatCards = memo(({ members, expenses, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
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
        { label: "Tổng chi", value: <AnimNumber value={total} />, icon: <CircleDollarSign size={15} />, accent: "text-[#f97316]" },
        { label: "Thành viên", value: members.length, icon: <UserRound size={15} />, accent: "text-[#facc15]" },
        { label: "Top chi", value: topSpender?.name?.split(" ").pop() || "—", icon: <TrendingUp size={15} />, accent: "text-[#f97316]" },
      ].map((s, i) => (
        <motion.div key={s.label}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 30 }}
          className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3"
        >
          <div className={`flex items-center gap-1 text-white/60 text-[10px] font-semibold uppercase tracking-wide mb-1.5`}>
            {s.icon} {s.label}
          </div>
          <div className="text-white font-bold text-sm leading-tight truncate">{s.value}</div>
        </motion.div>
      ))}
    </div>
  );
});
StatCards.displayName = "StatCards";

// ─── MemberList ───────────────────────────────────────────────────────────────

const MemberList = memo(({ members, onAdd, onRemove, onEdit, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [delTarget, setDelTarget] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    await onAdd(name.trim());
    setName("");
    setLoading(false);
  }, [name, onAdd, loading]);

  const commitEdit = useCallback((id: string) => {
    if (!editName.trim()) return;
    onEdit(id, editName.trim());
    setEditId(null);
  }, [editName, onEdit]);

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Tên thành viên…"
          aria-label="Tên thành viên"
          className={`flex-1 rounded-xl px-4 h-12 outline-none font-medium border-2 transition-all focus:ring-2 focus:ring-[#f97316]/20 text-sm ${t.input}`}
        />
        <motion.button
          type="submit"
          disabled={loading || !name.trim()}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
          className="h-12 px-5 rounded-xl font-bold text-sm flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white transition-colors shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] justify-center"
        >
          {loading ? <Spinner /> : <><Plus size={16} strokeWidth={2.5} /> Thêm</>}
        </motion.button>
      </form>

      {members.length === 0 ? (
        <EmptySlate icon={<Users size={28} strokeWidth={1.5} />} title="Chưa có thành viên" sub="Nhập tên và bấm Thêm để bắt đầu" dark={dark} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {members.map((m: any) => (
              <motion.div key={m.id} layout
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`group flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border-2 transition-all ${t.card} ${t.cardHover}`}
              >
                <Av name={m.name} size={28} />
                {editId === m.id ? (
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") commitEdit(m.id); if (e.key === "Escape") setEditId(null); }}
                    aria-label="Sửa tên"
                    className={`w-24 px-2 py-0.5 text-xs font-bold rounded-lg outline-none border-2 transition-all ${t.input}`}
                  />
                ) : (
                  <span className={`text-sm font-semibold ${t.text}`}>{m.name}</span>
                )}
                <div className="flex items-center gap-1 overflow-hidden w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-200">
                  {editId === m.id ? (
                    <button onClick={() => commitEdit(m.id)} aria-label="Lưu" className="p-1 rounded-full text-emerald-600 bg-emerald-100 hover:bg-emerald-200 transition-colors">
                      <Check size={11} strokeWidth={3} />
                    </button>
                  ) : (
                    <button onClick={() => { setEditId(m.id); setEditName(m.name); }} aria-label="Sửa"
                      className={`p-1 rounded-full transition-colors ${t.pill} border`}>
                      <Pencil size={11} strokeWidth={2.5} />
                    </button>
                  )}
                  <button onClick={() => setDelTarget(m)} aria-label="Xóa"
                    className="p-1 rounded-full text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors">
                    <Trash2 size={11} strokeWidth={2.5} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal open={!!delTarget} onClose={() => setDelTarget(null)}
        onConfirm={() => onRemove(delTarget.id)}
        title="Xóa thành viên" dark={dark}
        message={`Xóa "${delTarget?.name}" sẽ xóa các khoản chi liên quan. Không thể hoàn tác.`} />
    </div>
  );
});
MemberList.displayName = "MemberList";

// ─── AddExpenseForm ───────────────────────────────────────────────────────────

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

const AddExpenseForm = memo(({ members, onAdd, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [split, setSplit] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSplit = useCallback((id: string) => setSplit(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]), []);
  const selAll = useCallback(() => setSplit(members.map((m: any) => m.id)), [members]);
  const clearAll = useCallback(() => setSplit([]), []);

  const addQuick = useCallback((amt: number) => {
    const cur = parseAmt(amount);
    setAmount(fmtInput(String(cur + amt)));
  }, [amount]);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAmt(amount);
    if (!title.trim() || !parsed || !payer || !split.length) {
      toast.error("Vui lòng điền đầy đủ thông tin!"); return;
    }
    setLoading(true);
    await onAdd({ title: title.trim(), amount: parsed, paidBy: payer, splitBetween: split });
    setTitle(""); setAmount(""); setSplit([]);
    setLoading(false);
  }, [title, amount, payer, split, onAdd]);

  const perHead = split.length ? Math.round(parseAmt(amount) / split.length) : 0;

  const inputCls = `w-full rounded-xl px-4 h-12 outline-none font-medium border-2 transition-all focus:ring-2 focus:ring-[#f97316]/20 text-sm ${t.input}`;
  const labelCls = `block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Tiêu đề + Số tiền */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className={labelCls} htmlFor="exp-title">Mục chi tiêu</label>
          <input id="exp-title" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="VD: Ăn tối, Taxi, Cà phê…"
            className={inputCls} />
        </div>
        <div className="sm:w-40">
          <label className={labelCls} htmlFor="exp-amount">Số tiền (đ)</label>
          <input id="exp-amount" type="text" inputMode="numeric"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onBlur={e => setAmount(e.target.value ? fmtInput(e.target.value) : "")}
            placeholder="0"
            className={`${inputCls} text-right font-bold text-[#f97316]`} />
        </div>
      </div>

      {/* Quick Add Pills */}
      <div>
        <label className={labelCls}>Thêm nhanh</label>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map(amt => (
            <motion.button key={amt} type="button"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => addQuick(amt)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors ${t.pill}`}>
              +{fmtVND(amt)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Payer + Split */}
      <div className={`p-4 rounded-xl border-2 ${t.card} flex flex-col gap-4`}>
        {/* Người thanh toán */}
        <div>
          <label className={labelCls}>Người thanh toán</label>
          <div className="flex flex-wrap gap-2">
            {members.map((m: any) => (
              <motion.button key={m.id} type="button"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                onClick={() => setPayer(m.id)}
                aria-pressed={payer === m.id}
                className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border-2 text-xs font-bold transition-colors ${payer === m.id ? t.pillActive : t.pill}`}>
                <Av name={m.name} size={22} /> {m.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chia cho */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className={`${labelCls} mb-0`}>Chia đều cho</label>
            <div className="flex gap-1.5">
              <button type="button" onClick={selAll}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${t.pill}`}>Tất cả</button>
              <button type="button" onClick={clearAll}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-colors ${t.pill}`}>Bỏ hết</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map((m: any) => {
              const sel = split.includes(m.id);
              return (
                <motion.label key={m.id}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                  className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border-2 text-xs font-bold cursor-pointer select-none transition-colors ${sel ? 'bg-emerald-500 border-emerald-500 text-white' : t.pill}`}>
                  <input type="checkbox" className="hidden" checked={sel} onChange={() => toggleSplit(m.id)} />
                  <Av name={m.name} size={22} /> {m.name}
                  {sel && perHead > 0 && (
                    <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">{fmtVND(perHead)}đ</span>
                  )}
                </motion.label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit */}
      <motion.button type="submit"
        disabled={loading}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        className="w-full h-12 bg-[#f97316] hover:bg-[#ea6c0a] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#f97316]/40">
        {loading ? <><Spinner /> Đang lưu…</> : <><Plus size={17} strokeWidth={2.5} /> Thêm Khoản Chi</>}
      </motion.button>
    </form>
  );
});
AddExpenseForm.displayName = "AddExpenseForm";

// ─── ExpenseList ──────────────────────────────────────────────────────────────

const ExpenseList = memo(({ expenses, members, onDelete, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const [del, setDel] = useState<any>(null);
  const getName = useCallback((id: string) => members.find((m: any) => m.id === id)?.name || "?", [members]);

  if (!expenses.length) return (
    <EmptySlate icon={<ReceiptText size={28} strokeWidth={1.5} />} title="Chưa có giao dịch nào" sub="Khoản chi sẽ xuất hiện ở đây" dark={dark} />
  );

  return (
    <div className="flex flex-col gap-2.5">
      <AnimatePresence>
        {[...expenses].reverse().map((exp: any, idx: number) => {
          const payerName = getName(exp.paidBy);
          return (
            <motion.div key={exp.id} layout
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30, delay: idx < 5 ? idx * 0.03 : 0 }}
              className={`group flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all hover:shadow-sm ${t.card} ${t.cardHover}`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dark ? 'bg-[#3d2b1a]' : 'bg-[#fef3e2]'}`}>
                <Coffee size={18} className="text-[#f97316]" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm mb-0.5 truncate ${t.text}`}>{exp.title}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.badge}`}>{payerName}</span>
                  <span className={`text-[10px] font-semibold ${t.textFaint}`}>chia {exp.splitBetween?.length || 0}</span>
                  <span className={`text-[10px] ${t.textFaint}`}>• {timeAgo(exp.createdAt)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <div className={`font-black text-[15px] tracking-tight text-[#f97316]`}>{fmtVND(exp.amount)}đ</div>
                <div className={`text-[10px] font-semibold ${t.textMuted}`}>{fmtVND(Math.round(exp.amount / (exp.splitBetween?.length || 1)))}đ/ng</div>
              </div>

              {/* Delete */}
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setDel(exp)} aria-label="Xóa khoản chi"
                className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 ml-1 flex-shrink-0">
                <Trash2 size={13} strokeWidth={2.5} />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={() => onDelete(del.id)}
        title="Xóa giao dịch" dark={dark}
        message={`Xóa khoản "${del?.title}" (${fmtVND(del?.amount || 0)}đ)?`} />
    </div>
  );
});
ExpenseList.displayName = "ExpenseList";

// ─── Settlement ───────────────────────────────────────────────────────────────

const Settlement = memo(({ members, expenses, dark }: any) => {
  const t = dark ? tokens.dark : tokens.light;
  const debts = useMemo(() => calculateOptimizedDebts(members, expenses), [members, expenses]);
  const getName = useCallback((id: string) => members.find((m: any) => m.id === id)?.name || "?", [members]);

  if (!debts.length) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
      <div className="text-4xl mb-3">🎉</div>
      <div className={`text-base font-black mb-1 ${t.text} ${display.className}`}>Hòa cả làng!</div>
      <div className={`text-sm ${t.textMuted}`}>Không ai nợ ai, chuyến đi thật tuyệt.</div>
    </motion.div>
  );

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence>
        {debts.map((d: any, i: number) => (
          <motion.div key={i} layout
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 30 }}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${t.card}`}
          >
            <div className="flex flex-col items-center gap-1 min-w-[52px]">
              <Av name={getName(d.from)} size={40} />
              <span className={`text-[10px] font-bold text-rose-500 text-center w-[58px] truncate`}>{getName(d.from)}</span>
            </div>

            <div className="flex-1 flex flex-col items-center">
              <span className="font-black text-base text-[#f97316] tracking-tight mb-1">{fmtVND(d.amount)}đ</span>
              <div className="flex items-center gap-1 w-full max-w-[100px]">
                <div className="h-px flex-1 bg-gradient-to-r from-rose-300 to-[#f97316]" />
                <ArrowRight size={12} className="text-[#f97316]" strokeWidth={3} />
                <div className="h-px flex-1 bg-gradient-to-r from-[#f97316] to-emerald-400" />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${t.textFaint}`}>chuyển cho</span>
            </div>

            <div className="flex flex-col items-center gap-1 min-w-[52px]">
              <Av name={getName(d.to)} size={40} />
              <span className={`text-[10px] font-bold text-emerald-500 text-center w-[58px] truncate`}>{getName(d.to)}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
Settlement.displayName = "Settlement";

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function SplitBillApp() {
  const [members, setMembers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dark, setDark] = useLS("split_dark_v4", false);
  const [tab, setTab] = useState("expenses");
  const [resetOpen, setResetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  useEffect(() => {
    setIsMounted(true);
    fetch(`${API_URL}/members`)
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error("Lỗi kết nối Java API Members:", err));
    fetch(`${API_URL}/expenses`)
      .then(res => res.json())
      .then(data => setExpenses(data))
      .catch(err => console.error("Lỗi kết nối Java API Expenses:", err));
  }, []);

  const addMember = useCallback(async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error();
      const newMember = await res.json();
      setMembers((p: any) => [...p, newMember]);
      toast.success("Đã thêm thành viên!");
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    }
  }, []);

  const addExpense = useCallback(async (exp: any) => {
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exp)
      });
      if (!res.ok) throw new Error();
      const newExpense = await res.json();
      setExpenses((p: any) => [...p, newExpense]);
      toast.success("Đã lưu khoản chi!");
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    }
  }, []);

  const delExpense = useCallback(async (id: string) => {
    try {
      await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE" });
      setExpenses((p: any) => p.filter((e: any) => e.id !== id));
      toast.success("Đã xóa khoản chi");
    } catch {
      toast.error("Lỗi kết nối máy chủ!");
    }
  }, []);

  const removeMember = useCallback((id: string) => {
    setMembers((p: any) => p.filter((m: any) => m.id !== id));
    toast("Mẹo: Cần tạo thêm API xóa Member bên Java!", { icon: "⚠️" });
  }, []);

  const editMember = useCallback((id: string, name: string) => {
    setMembers((p: any) => p.map((m: any) => m.id === id ? { ...m, name } : m));
  }, []);

  const resetAll = useCallback(() => {
    toast("Mẹo: Cần tạo thêm API Reset bên Java!", { icon: "⚠️" });
    setResetOpen(false);
  }, []);

  const t = dark ? tokens.dark : tokens.light;

  if (!isMounted) return null;

  return (
    <div className={`${body.className} min-h-screen transition-colors duration-300 ${t.bg}`}>
      {/* Toast Config */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            fontFamily: body.style.fontFamily,
            fontSize: "13px",
            fontWeight: 600,
            background: dark ? "#221a0e" : "#fffdf9",
            color: dark ? "#f0e6d3" : "#3d2b1a",
            border: `1px solid ${dark ? "#3d2b1a" : "#e8dfd0"}`,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "white" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "white" } },
        }}
      />

      {/* Header */}
      <div className={`${t.headerBg} pb-14 pt-8 relative overflow-hidden`}>
        {/* Decorative */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #f97316 0, #f97316 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

        <div className="max-w-lg mx-auto px-4 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="bg-[#f97316] w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-orange-900/40">
                  <Wallet size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <h1 className={`text-2xl font-black text-[#fef3e2] tracking-tight ${display.className}`}>Chia & Trả</h1>
              </div>
              <p className="text-[#a8865a] text-xs font-semibold pl-11">Quản lý chi tiêu nhóm</p>
            </div>

            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setDark((d: boolean) => !d)}
                aria-label={dark ? "Chế độ sáng" : "Chế độ tối"}
                className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-colors ${dark ? 'border-[#3d2b1a] bg-[#221a0e] text-[#a8865a] hover:border-[#f97316]' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}>
                {dark ? <Sun size={16} strokeWidth={2.5} /> : <Moon size={16} strokeWidth={2.5} />}
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setResetOpen(true)}
                aria-label="Làm mới"
                className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-colors ${dark ? 'border-[#3d2b1a] bg-[#221a0e] text-[#a8865a] hover:border-rose-600' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}>
                <RotateCcw size={16} strokeWidth={2.5} />
              </motion.button>
            </div>
          </div>

          <StatCards members={members} expenses={expenses} dark={dark} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 -mt-6 pb-12 flex flex-col gap-4 relative z-20">

        {/* Members Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
          <Card dark={dark}>
            <SectionTitle icon={<Users size={16} />} title="Thành viên nhóm" dark={dark} />
            <MemberList members={members} onAdd={addMember} onRemove={removeMember} onEdit={editMember} dark={dark} />
          </Card>
        </motion.div>

        {/* Add Expense Card */}
        <AnimatePresence>
          {members.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card dark={dark}>
                <SectionTitle icon={<Plus size={16} />} title="Thêm khoản chi" dark={dark} />
                <AddExpenseForm members={members} onAdd={addExpense} dark={dark} />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs + Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {/* Tab switcher */}
          <div className={`flex gap-1 p-1 rounded-2xl mb-4 border-2 ${t.tab}`}>
            {[
              { key: "expenses", label: `Giao dịch (${expenses.length})`, icon: <ReceiptText size={14} strokeWidth={2.5} /> },
              { key: "settle", label: "Phương án chốt", icon: <Banknote size={14} strokeWidth={2.5} /> },
            ].map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200
                  ${tab === tb.key ? t.tabActive : t.tabInactive}`}>
                {tb.icon} {tb.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "expenses" ? (
              <motion.div key="expenses" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                <Card dark={dark}>
                  <SectionTitle icon={<ReceiptText size={16} />} title="Lịch sử giao dịch" dark={dark} />
                  <ExpenseList expenses={expenses} members={members} onDelete={delExpense} dark={dark} />
                </Card>
              </motion.div>
            ) : (
              <motion.div key="settle" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                <Card dark={dark}>
                  <SectionTitle icon={<Sparkles size={16} />} title="Phương án thanh toán tối ưu" dark={dark} />
                  <Settlement members={members} expenses={expenses} dark={dark} />
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <ConfirmModal open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={resetAll}
        title="Làm mới toàn bộ" dark={dark}
        message="Hành động này sẽ xóa hết thành viên và khoản chi. Bạn có chắc không?" />
    </div>
  );
}