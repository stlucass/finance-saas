"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowRightLeft, Plus, Pencil, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

export default function Transactions() {
  const transactions = [
    { id: 1, desc: "Salário", amount: 8500.00, type: "INCOME", date: "2026-08-01", recurring: true, category: "Salário", account: "Itaú Corrente" },
    { id: 2, desc: "Supermercado Extra", amount: 450.00, type: "EXPENSE", date: "2026-08-02", recurring: false, category: "Alimentação", account: "Nubank" },
    { id: 3, desc: "Assinatura Netflix", amount: 45.90, type: "EXPENSE", date: "2026-08-05", recurring: true, category: "Lazer", account: "Nubank" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <ArrowRightLeft className="text-primary w-8 h-8" />
              Transações
            </h2>
            <p className="text-muted-foreground mt-1">Histórico de todas as suas entradas e saídas.</p>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors">
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </header>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/20">
            <input 
              type="text" 
              placeholder="Buscar transação..." 
              className="bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary w-64"
            />
            {/* Aqui no futuro pode ter um filtro de Mês/Ano */}
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-border">Descrição</th>
                <th className="p-4 font-medium border-b border-border">Categoria / Conta</th>
                <th className="p-4 font-medium border-b border-border">Data</th>
                <th className="p-4 font-medium border-b border-border text-right">Valor</th>
                <th className="p-4 font-medium border-b border-border text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tx.type === 'INCOME' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.type === 'INCOME' ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
                      </div>
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          {tx.desc}
                          {tx.recurring && <RefreshCw className="w-3 h-3 text-muted-foreground" title="Recorrente" />}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <span className="font-medium">{tx.category}</span>
                      <span className="text-muted-foreground block text-xs">{tx.account}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {tx.date}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-bold ${tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 bg-secondary text-muted-foreground hover:text-primary rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-secondary text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
