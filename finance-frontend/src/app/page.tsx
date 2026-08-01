"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowUpRight, ArrowDownRight, Wallet, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

type Transaction = {
  amount: number;
  type: string;
  date: string;
  category?: { name: string };
};

const PIE_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [txData, accountsData] = await Promise.all([
        fetchApi("/transactions"),
        fetchApi("/accounts")
      ]);

      let totalBalance = 0;
      accountsData.forEach((acc: any) => {
        totalBalance += acc.balance;
      });

      let totalIncome = 0;
      let totalExpense = 0;

      const barDataMap: Record<string, any> = {};
      const pieDataMap: Record<string, number> = {};

      txData.forEach((tx: any) => {
        if (tx.type === "INCOME") totalIncome += tx.amount;
        if (tx.type === "EXPENSE") totalExpense += tx.amount;

        const date = tx.date;
        if (!barDataMap[date]) {
          barDataMap[date] = { name: date, Receitas: 0, Despesas: 0 };
        }
        if (tx.type === "INCOME") barDataMap[date].Receitas += tx.amount;
        if (tx.type === "EXPENSE") barDataMap[date].Despesas += tx.amount;

        if (tx.type === "EXPENSE") {
          const catName = tx.category?.name || "Sem Categoria";
          pieDataMap[catName] = (pieDataMap[catName] || 0) + tx.amount;
        }
      });

      const sortedBarData = Object.values(barDataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
      const finalPieData = Object.keys(pieDataMap).map(key => ({ name: key, value: pieDataMap[key] }));

      setBalance(totalBalance);
      setIncome(totalIncome);
      setExpense(totalExpense);
      setBarData(sortedBarData);
      setPieData(finalPieData);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Visão geral das suas finanças.</p>
        </header>

        {loading ? (
          <div className="text-center text-muted-foreground py-10">Calculando...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Wallet className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Saldo Total Contas</p>
                    <h3 className="text-3xl font-bold mt-1">R$ {balance.toFixed(2)}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ArrowUpRight className="w-24 h-24 text-green-500" />
                </div>
                <div className="flex flex-col relative z-10">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total de Entradas</p>
                  <h3 className="text-3xl font-bold text-green-500">R$ {income.toFixed(2)}</h3>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ArrowDownRight className="w-24 h-24 text-red-500" />
                </div>
                <div className="flex flex-col relative z-10">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total de Saídas</p>
                  <h3 className="text-3xl font-bold text-red-500">R$ {expense.toFixed(2)}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-lg">
                <h3 className="text-lg font-bold mb-6">Fluxo de Caixa Diário</h3>
                <div className="h-[300px] w-full">
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Nenhum dado registrado.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border shadow-lg">
                <h3 className="text-lg font-bold mb-6">Despesas por Categoria</h3>
                <div className="h-[300px] w-full">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                          formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Nenhuma despesa registrada.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
