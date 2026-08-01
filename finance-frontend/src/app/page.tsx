"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowUpRight, ArrowDownRight, Wallet, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

type Transaction = {
  amount: number;
  type: string;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Para o dashboard, buscamos as transações e as contas
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
      txData.forEach((tx: Transaction) => {
        if (tx.type === "INCOME") totalIncome += tx.amount;
        if (tx.type === "EXPENSE") totalExpense += tx.amount;
      });

      setBalance(totalBalance);
      setIncome(totalIncome);
      setExpense(totalExpense);
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
        )}

        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg min-h-[300px] flex flex-col items-center justify-center text-muted-foreground">
          <Activity className="w-12 h-12 mb-3 opacity-20" />
          <p>Gráficos de evolução serão implementados aqui na próxima etapa.</p>
        </div>
      </main>
    </div>
  );
}
