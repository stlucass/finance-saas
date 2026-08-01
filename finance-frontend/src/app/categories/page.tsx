"use client";

import { Sidebar } from "@/components/Sidebar";
import { Tags, Plus, Pencil, Trash2 } from "lucide-react";

export default function Categories() {
  const categories = [
    { id: 1, name: "Salário", type: "INCOME", color: "#22c55e" },
    { id: 2, name: "Alimentação", type: "EXPENSE", color: "#ef4444" },
    { id: 3, name: "Transporte", type: "EXPENSE", color: "#eab308" },
    { id: 4, name: "Lazer", type: "EXPENSE", color: "#3b82f6" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Tags className="text-primary w-8 h-8" />
              Categorias
            </h2>
            <p className="text-muted-foreground mt-1">Crie e edite as categorias de movimentações.</p>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors">
            <Plus className="w-5 h-5" />
            Nova Categoria
          </button>
        </header>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground text-sm uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-border">Nome</th>
                <th className="p-4 font-medium border-b border-border">Tipo</th>
                <th className="p-4 font-medium border-b border-border">Cor</th>
                <th className="p-4 font-medium border-b border-border text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-medium flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    {cat.name}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cat.type === 'INCOME' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {cat.type === 'INCOME' ? 'RECEITA' : 'DESPESA'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-muted-foreground font-mono">{cat.color}</span>
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
