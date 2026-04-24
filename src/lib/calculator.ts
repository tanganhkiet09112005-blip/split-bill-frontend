export interface Member { id: string; name: string; }
export interface Expense { id: string; title: string; amount: number; paidBy: string; splitBetween: string[]; }
export interface Transaction { from: string; to: string; amount: number; }

export const calculateOptimizedDebts = (members: Member[], expenses: Expense[]): Transaction[] => {
  // 1. Tính toán số dư ròng cho từng thành viên
  const balances: Record<string, number> = {};
  members.forEach(m => (balances[m.id] = 0));

  expenses.forEach(exp => {
    // Người trả tiền sẽ có số dư dương (nhận lại tiền)
    if (balances[exp.paidBy] !== undefined) {
      balances[exp.paidBy] += exp.amount;
    }

    // Những người tham gia chia tiền sẽ bị trừ tiền (số dư âm)
    const splitAmount = exp.amount / exp.splitBetween.length;
    exp.splitBetween.forEach(userId => {
      if (balances[userId] !== undefined) {
        balances[userId] -= splitAmount;
      }
    });
  });

  // 2. Tách thành nhóm người nợ (debtors) và người chủ nợ (creditors)
  const debtors = Object.keys(balances)
    .map(id => ({ id, balance: balances[id] }))
    .filter(m => m.balance < -0.01) // Sửa lỗi sai số dấu phẩy động
    .sort((a, b) => a.balance - b.balance); // Âm nhiều nhất xếp trước

  const creditors = Object.keys(balances)
    .map(id => ({ id, balance: balances[id] }))
    .filter(m => m.balance > 0.01)
    .sort((a, b) => b.balance - a.balance); // Dương nhiều nhất xếp trước

  // 3. Áp dụng thuật toán Tham lam (Greedy) để ghép cặp người nợ và chủ nợ
  const transactions: Transaction[] = [];
  let i = 0; // Con trỏ người nợ
  let j = 0; // Con trỏ chủ nợ

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    // Tìm số tiền tối đa có thể thanh toán trong giao dịch này
    const amountToSettle = Math.min(Math.abs(debtor.balance), creditor.balance);

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(amountToSettle * 100) / 100 // Làm tròn 2 chữ số thập phân
    });

    // Cập nhật lại số dư
    debtor.balance += amountToSettle;
    creditor.balance -= amountToSettle;

    // Di chuyển con trỏ nếu số dư đã được thanh toán hết
    if (Math.abs(debtor.balance) < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }

  return transactions;
};