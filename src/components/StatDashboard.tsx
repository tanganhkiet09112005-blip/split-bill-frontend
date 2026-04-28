"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// 1. ĐỊNH NGHĨA INTERFACE RÕ RÀNG (Bí kíp xóa lỗi đỏ)
interface StatData {
  memberName: string;
  totalSpent: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function StatDashboard({ data }: { data: StatData[] }) {
  // Lọc bỏ những ai chưa tiêu đồng nào cho biểu đồ đỡ rối
  const chartData = data.filter(d => d.totalSpent > 0);

  if (chartData.length === 0) return (
    <div className="text-center py-10 text-slate-400 text-sm italic border border-dashed border-slate-200 rounded-xl mt-4 dark:border-slate-800">
      Chưa có khoản chi nào để phân tích!
    </div>
  );

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="totalSpent"
            nameKey="memberName"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          {/* ─── 2. ĐÃ FIX LỖI FORMATTER (XÓA SẠCH MÀU ĐỎ) ─── */}
          <Tooltip 
            formatter={(value: any) => {
              // Vì Pie sử dụng dataKey="totalSpent" (là number), 
              // ta có thể an tâm ép kiểu nó về number hoặc chuyển sang string để format
              const amount = Number(value);
              return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
            }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}