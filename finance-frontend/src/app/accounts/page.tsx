"use client";

import { Sidebar } from "@/components/Sidebar";
import { Wallet, Plus, Pencil, Trash2 } from "lucide-react";

export default function Accounts() {
  const accounts = [
    { id: 1, name: "Itaú Corrente", balance: 5240.50, invested: 0 },
    { id: 2, name: "Nubank", balance: 1250.00, invested: 5000.00 },
    { id: 3, name: "Rico Investimentos", balance: 0, invested: 15400.00 },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="text-primary w-8 h-8" />
              Minhas Contas
            </h2>
            <p className="text-muted-foreground mt-1">Gerencie seus saldos e investimentos manualmente.</p>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors">
            <Plus className="w-5 h-5" />
            Nova Conta
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="bg-card p-6 rounded-2xl border border-border hover:border-primary/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{account.name}</h3>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-secondary text-muted-foreground hover:text-primary rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-secondary text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted-foreground">Saldo Atual</span>
                  <span className="font-semibold text-lg">R$ {account.balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Investido</span>
                  <span className="font-semibold text-primary">R$ {account.invested.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
