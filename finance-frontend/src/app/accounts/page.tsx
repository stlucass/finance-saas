"use client";

import { Sidebar } from "@/components/Sidebar";
import { Wallet, Plus, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

type Account = {
  id?: number;
  name: string;
  balance: number;
  investedAmount: number;
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Account>({ name: "", balance: 0, investedAmount: 0 });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await fetchApi("/accounts");
      setAccounts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await fetchApi(`/accounts/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await fetchApi("/accounts", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      loadAccounts();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar conta");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetchApi(`/accounts/${id}`, { method: "DELETE" });
      loadAccounts();
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
              <Wallet className="text-primary w-8 h-8" />
              Minhas Contas
            </h2>
            <p className="text-muted-foreground mt-1">Gerencie seus saldos e investimentos manualmente.</p>
          </div>
          <button 
            onClick={() => {
              setFormData({ name: "", balance: 0, investedAmount: 0 });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Conta
          </button>
        </header>

        {loading ? (
          <div className="text-center text-muted-foreground py-10">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <div key={account.id} className="bg-card p-6 rounded-2xl border border-border hover:border-primary/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{account.name}</h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setFormData(account);
                        setShowModal(true);
                      }}
                      className="p-2 bg-secondary text-muted-foreground hover:text-primary rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => account.id && handleDelete(account.id)}
                      className="p-2 bg-secondary text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                    >
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
                    <span className="font-semibold text-primary">R$ {account.investedAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-10">
                Nenhuma conta cadastrada.
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-2xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">{formData.id ? "Editar Conta" : "Nova Conta"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Nome da Instituição</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Saldo</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.balance} 
                      onChange={e => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Investido</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.investedAmount} 
                      onChange={e => setFormData({...formData, investedAmount: parseFloat(e.target.value) || 0})}
                      className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-blue-600">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
