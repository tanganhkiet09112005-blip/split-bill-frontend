"use client";

import { useState, useEffect, useCallback, memo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Users, Plus, Trash2, Check, X, ReceiptText,
  ArrowRight, Loader2, ArrowLeft, PieChart as PieChartIcon, UserPlus
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// ─── ĐỊNH NGHĨA KIỂU DỮ LIỆU ───────────────────────────────────────────────
interface Member { userId: string; name: string; groupId: string; }
interface Expense {
  id?: string; description: string; amount: number; paidBy: string; 
  groupId: string; splitType: string; splitBetween?: string[];
  createdAt?: number;
}
interface DebtResponse { fromMemberId: string; fromMemberName: string; toMemberId: string; toMemberName: string; amount: number; }
interface StatData { memberName: string; totalSpent: number; }

// ─── UTILS ─────────────────────────────────────────────────────────
const fmtVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
const fmtInput = (v: string) => { const n = v.replace(/\D/g, ""); return n ? new Intl.NumberFormat("vi-VN").format(parseInt(n)) : ""; };
const parseAmt = (s: string) => parseInt(String(s).replace(/\D/g, "")) || 0;
const initials = (n: string) => n ? n.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

// ─── COMPONENT AVATAR CHỮ ───────────────────────────────────────────────
const Avatar = memo(({ name }: { name: string }) => {
  const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700", "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700"];
  const c = colors[(name || "?").length % colors.length];
  return <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-xs ${c}`}>{initials(name)}</div>;
});

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = (params?.id || params?.groupId) as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [serverDebts, setServerDebts] = useState<DebtResponse[]>([]);
  const [stats, setStats] = useState<StatData[]>([]);
  
  const [tab, setTab] = useState("expenses");
  const [isMounted, setIsMounted] = useState(false);
  const [userName, setUserName] = useState("Sếp");

  // State cho Modal Thêm Thành Viên
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://split-bill-backend-5srl.onrender.com/api";

  const fetchSettlement = useCallback(async () => {
    if (!groupId) return;
    try { const res = await fetch(`${API_URL}/members/debts/${groupId}`); if (res.ok) setServerDebts(await res.json()); } catch {}
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

  if (!groupId) return <div className="min-h-screen flex items-center justify-center">Lỗi: Không tìm thấy Mã Nhóm!</div>;
  if (!isMounted) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  // --- API THÊM THÀNH VIÊN GUEST ---
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return toast.error("Vui lòng nhập tên thành viên!");
    setIsAddingMember(true);
    try {
      const res = await fetch(`${API_URL}/members`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          groupId: groupId,
          name: newMemberName,
          role: "MEMBER",
          userId: `guest_${Date.now()}` // Tạo ID giả cho khách để Backend không báo lỗi null
        }) 
      });
      if (res.ok) { 
        loadData(); 
        toast.success("Đã thêm thành viên thành công!"); 
        setNewMemberName("");
        setIsAddMemberOpen(false);
      } else {
        toast.error("Lỗi từ server!");
      }
    } catch { toast.error("Không kết nối được Backend!"); }
    finally { setIsAddingMember(false); }
  };

  const addExpense = async (exp: Expense) => {
    try { const res = await fetch(`${API_URL}/expenses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exp) }); if (res.ok) { loadData(); toast.success("Đã lưu hóa đơn!"); } } catch { toast.error("Lỗi mạng!"); }
  };

  const delExpense = async (id: string) => {
    if (!window.confirm("Sếp có chắc muốn xóa hóa đơn này?")) return;
    try { const res = await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE" }); if (res.ok) { loadData(); toast.success("Đã xóa hóa đơn!"); } } catch { toast.error("Lỗi!"); }
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Toaster position="top-center" />
      
      {/* HEADER GỌN GÀNG */}
      <div className="bg-indigo-600 pb-16 pt-6 text-white shadow-md px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.push("/dashboard")} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black">PAYSHARE</h1>
              <p className="text-xs text-indigo-200 uppercase tracking-widest font-semibold">Mã nhóm: {groupId}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center"><p className="text-[10px] text-indigo-100 font-bold uppercase mb-1">Tổng chi</p><p className="text-lg font-black">{fmtVND(totalSpent)}</p></div>
             <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center"><p className="text-[10px] text-indigo-100 font-bold uppercase mb-1">Thành viên</p><p className="text-lg font-black">{members.length}</p></div>
             <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center"><p className="text-[10px] text-emerald-200 font-bold uppercase mb-1">Chốt nợ</p><p className="text-lg font-black text-emerald-300">{serverDebts.length} GD</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 flex flex-col gap-6">
        
        {/* DANH SÁCH THÀNH VIÊN LOGIC MỚI */}
        <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-slate-800"><Users size={18} className="text-indigo-600"/> Ai đang trong nhóm?</h2>
            <button onClick={() => setIsAddMemberOpen(true)} className="flex items-center gap-1 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition">
              <UserPlus size={16} /> Thêm người
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {members.map(m => (
              <div key={m.userId} className="flex items-center gap-2 bg-slate-50 border border-slate-100 py-1.5 px-2 pr-4 rounded-full">
                <Avatar name={m.name} />
                <span className="text-sm font-semibold text-slate-700">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM THÊM HÓA ĐƠN CÂN CHỈNH LẠI */}
        <div className="p-6 rounded-2xl bg-white shadow-sm border border-slate-200">
           <h2 className="text-base font-bold flex items-center gap-2 text-slate-800 mb-4"><Plus size={18} className="text-indigo-600"/> Thêm khoản chi mới</h2>
           <AddExpenseForm members={members} onAdd={addExpense} groupId={groupId} />
        </div>

        {/* THANH ĐIỀU HƯỚNG TABS */}
        <div className="flex p-1.5 rounded-xl bg-slate-100 border border-slate-200">
          <button onClick={() => setTab("expenses")} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "expenses" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>Lịch sử</button>
          <button onClick={() => { setTab("settle"); fetchSettlement(); }} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "settle" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}>Chốt nợ</button>
        </div>

        {/* NỘI DUNG TABS */}
        <div className="p-2">
          {tab === "expenses" && (
            <div className="flex flex-col gap-4">
              {expenses.length === 0 ? <p className="text-center text-sm text-slate-400 py-10 font-medium">Nhóm chưa có khoản chi nào...</p> : 
                [...expenses].reverse().map((exp, idx) => (
                  <div key={exp.id || idx} className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex-1">
                      <p className="font-bold text-base text-slate-800 mb-1">{exp.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 text-indigo-700 font-black text-sm px-2 py-0.5 rounded-md">{fmtVND(exp.amount)}</span>
                        <span className="text-xs text-slate-500 font-medium">Đóng bởi: {members.find(m => m.userId === exp.paidBy)?.name || "Ẩn danh"}</span>
                      </div>
                    </div>
                    <button onClick={() => exp.id && delExpense(exp.id)} className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"><Trash2 size={18} /></button>
                  </div>
                ))
              }
            </div>
          )}

          {tab === "settle" && (
            <div className="flex flex-col gap-4">
              {serverDebts.length === 0 ? <div className="text-center py-10 bg-emerald-50 rounded-2xl border border-emerald-100"><p className="text-emerald-600 font-black text-lg">🎉 SẠCH NỢ!</p><p className="text-emerald-500 text-sm mt-1">Không ai nợ ai đồng nào cả.</p></div> : 
                serverDebts.map((d, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white rounded-2xl shadow-sm border border-slate-100 gap-4">
                    <div className="flex items-center w-full sm:w-auto justify-between flex-1 gap-2">
                      <div className="flex flex-col items-center bg-slate-50 p-2 rounded-lg flex-1">
                        <span className="text-xs text-slate-400 font-semibold mb-1">NGƯỜI NỢ</span>
                        <span className="font-bold text-slate-800 text-center">{d.fromMemberName}</span>
                      </div>
                      <ArrowRight size={20} className="text-slate-300 flex-shrink-0" />
                      <div className="flex flex-col items-center bg-emerald-50 p-2 rounded-lg flex-1">
                        <span className="text-xs text-emerald-400 font-semibold mb-1">CHỦ NỢ</span>
                        <span className="font-bold text-emerald-700 text-center">{d.toMemberName}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-0 sm:pl-4 sm:border-l border-slate-100">
                      <span className="text-indigo-600 font-black text-xl whitespace-nowrap">{fmtVND(d.amount)}</span>
                      <button onClick={() => alert(`Sếp tự gửi qua Zalo cho ${d.fromMemberName} đòi tiền nhé!`)} className="p-2.5 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition" title="Đòi nợ"><ReceiptText size={18} /></button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* MODAL THÊM THÀNH VIÊN XỊN XÒ */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-indigo-600">Thêm người vào nhóm</h3>
              <button onClick={() => setIsAddMemberOpen(false)} className="p-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200"><X size={18}/></button>
            </div>
            <form onSubmit={handleAddMember}>
              <input 
                type="text" 
                placeholder="Nhập tên người bạn..." 
                value={newMemberName} 
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full h-12 px-4 mb-5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium"
                required autoFocus
              />
              <button type="submit" disabled={isAddingMember} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center">
                {isAddingMember ? <Loader2 className="animate-spin" size={18}/> : "Thêm vào nhóm"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FORM THÊM CHI TIÊU ĐƯỢC THIẾT KẾ LẠI ─────────────────────────────────────
function AddExpenseForm({ members, onAdd, groupId }: { members: Member[], onAdd: (e: Expense) => void, groupId: string }) {
  const [desc, setDesc] = useState(""); 
  const [amount, setAmount] = useState(""); 
  const [payer, setPayer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    if(!desc || !amount || !payer) return toast.error("Nhập đủ thông tin nha Sếp!");
    onAdd({ description: desc, amount: parseAmt(amount), paidBy: payer, groupId, splitType: "EQUAL", splitBetween: members.map(m => m.userId) });
    setDesc(""); setAmount(""); setPayer("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input placeholder="Hôm nay Sếp chi tiền cho việc gì? (VD: Tiền nhậu)" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-700" />
      <div className="flex flex-col sm:flex-row gap-4">
        <input placeholder="Số tiền (VND)" value={amount} onChange={e => setAmount(fmtInput(e.target.value))} className="w-full sm:w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-black text-indigo-600 text-lg" />
        <select value={payer} onChange={e => setPayer(e.target.value)} className="w-full sm:w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold text-slate-700 cursor-pointer">
          <option value="" disabled>Ai là người trả tiền?</option>
          {members.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
        </select>
      </div>
      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 mt-2 shadow-md">
        <Check size={18} strokeWidth={3} /> GHI NHẬN HÓA ĐƠN
      </button>
    </form>
  );
}