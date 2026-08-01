"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowRightLeft, Plus, Pencil, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

type Transaction = {
  id?: number;
  description: string;
  amount: number;
  type: string;
  date: string;
  recurring: boolean;
  recurrenceFrequency?: string;
  account: { id: number, name?: string };
  category: { id: number, name?: string, color?: string };
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState<any>({ 
    description: "", amount: 0, type: "EXPENSE", date: new Date().toISOString().split('T')[0], 
    recurring: false, accountId: "", categoryId: "" 
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [txData, accData, catData] = await Promise.all([
        fetchApi("/transactions"),
        fetchApi("/accounts"),
        fetchApi("/categories")
      ]);
      setTransactions(txData);
      setAccounts(accData);
      setCategories(catData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        description: formData.description,
        amount: Number(formData.amount),
        type: formData.type,
        date: formData.date,
        recurring: formData.recurring,
        account: { id: Number(formData.accountId) },
        category: { id: Number(formData.categoryId) }
      };

      if (formData.id) {
        await fetchApi(`/transactions/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi("/transactions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      loadAllData();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar transação");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      await fetchApi(`/transactions/${id}`, { method: "DELETE" });
      loadAllData();
    } catch (error) {
      console.error(error);
      alert("Erro ao deletar");
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8 relative">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <ArrowRightLeft className="text-primary w-8 h-8" />
              Transações
            </h2>
            <p className="text-muted-foreground mt-1">Histórico de todas as suas entradas e saídas.</p>
          </div>
          <button 
            onClick={() => {
              setFormData({ 
                description: "", amount: 0, type: "EXPENSE", date: new Date().toISOString().split('T')[0], 
                recurring: false, accountId: accounts[0]?.id || "", categoryId: categories[0]?.id || "" 
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </header>

        {loading ? (
          <div className="text-center text-muted-foreground py-10">Carregando...</div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/20">
              <input 
                type="text" 
                placeholder="Buscar transação..." 
                className="bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary w-64"
              />
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
                            {tx.description}
                            {tx.recurring && <span title="Recorrente"><RefreshCw className="w-3 h-3 text-muted-foreground" /></span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <span className="font-medium">{tx.category?.name}</span>
                        <span className="text-muted-foreground block text-xs">{tx.account?.name}</span>
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
                        <button 
                          onClick={() => {
                            setFormData({
                              id: tx.id, description: tx.description, amount: tx.amount, type: tx.type, 
                              date: tx.date, recurring: tx.recurring, accountId: tx.account?.id, categoryId: tx.category?.id
                            });
                            setShowModal(true);
                          }}
                          className="p-2 bg-secondary text-muted-foreground hover:text-primary rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => tx.id && handleDelete(tx.id)}
                          className="p-2 bg-secondary text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhuma transação encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-2xl w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4">{formData.id ? "Editar Transação" : "Nova Transação"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-muted-foreground mb-1">Descrição</label>
                    <input 
                      type="text" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Valor (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.amount} 
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Tipo</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="EXPENSE">Despesa</option>
                      <option value="INCOME">Receita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Data</label>
                    <input 
                      type="date" 
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-7">
                    <input 
                      type="checkbox" 
                      id="recurring"
                      checked={formData.recurring} 
                      onChange={e => setFormData({...formData, recurring: e.target.checked})}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="recurring" className="text-sm text-foreground">É recorrente?</label>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Conta</label>
                    <select 
                      value={formData.accountId}
                      onChange={e => setFormData({...formData, accountId: e.target.value})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                      required
                    >
                      <option value="" disabled>Selecione...</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Categoria</label>
                    <select 
                      value={formData.categoryId}
                      onChange={e => setFormData({...formData, categoryId: e.target.value})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                      required
                    >
                      <option value="" disabled>Selecione...</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-blue-600">Salvar Transação</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
