"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowDownRight, ArrowUpRight, DollarSign } from "lucide-react";

export default function Dashboard() {
  const summary = [
    { title: "Saldo Total", amount: "R$ 15.240,50", icon: DollarSign, color: "text-blue-500" },
    { title: "Receitas do Mês", amount: "R$ 8.500,00", icon: ArrowUpRight, color: "text-green-500" },
    { title: "Despesas do Mês", amount: "R$ 3.250,90", icon: ArrowDownRight, color: "text-red-500" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold">Visão Geral</h2>
          <p className="text-muted-foreground mt-1">Acompanhe seu desempenho financeiro deste mês.</p>
        </header>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {summary.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between hover:border-primary/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{item.title}</p>
                  <h3 className="text-3xl font-bold">{item.amount}</h3>
                </div>
                <div className={`p-4 rounded-xl bg-secondary ${item.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Gráficos e Tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 min-h-[400px]">
             <h3 className="text-xl font-bold mb-4">Fluxo de Caixa (Em breve)</h3>
             <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Gráfico Recharts será inserido aqui...
             </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-6 min-h-[400px]">
             <h3 className="text-xl font-bold mb-4">Transações Recentes</h3>
             <div className="space-y-4">
                {/* Exemplo Mockado */}
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-secondary rounded-lg transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${i % 2 === 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {i % 2 === 0 ? <ArrowUpRight className="w-5 h-5"/> : <ArrowDownRight className="w-5 h-5"/>}
                      </div>
                      <div>
                        <p className="font-medium">{i % 2 === 0 ? 'Salário Mensal' : 'Supermercado'}</p>
                        <p className="text-xs text-muted-foreground">01 Agosto 2026</p>
                      </div>
                    </div>
                    <span className={`font-bold ${i % 2 === 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {i % 2 === 0 ? '+' : '-'}R$ {i % 2 === 0 ? '8.500,00' : '450,00'}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
