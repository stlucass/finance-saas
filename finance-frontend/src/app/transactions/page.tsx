"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowRightLeft, Plus, Pencil, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, X, Download, Play, CalendarClock, Clock, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

type Transaction = {
  id?: number;
  description: string;
  amount: number;
  type: string;
  date: string;
  recurring: boolean;
  paid: boolean;
  recurrenceFrequency?: string;
  nextRecurrenceDate?: string;
  account: { id: number, name?: string };
  category: { id: number, name?: string, color?: string };
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"history" | "recurring">("history");
  
  const [formData, setFormData] = useState<any>({ 
    description: "", amount: 0, type: "EXPENSE", date: new Date().toISOString().split('T')[0], 
    recurring: false, paid: true, accountId: "", categoryId: "" 
  });

  useEffect(() => {
    loadAllData();
  }, [selectedMonth, selectedYear]);

  const loadAllData = async () => {
    try {
      let query = "";
      if (selectedMonth) query += `month=${selectedMonth}&`;
      if (selectedYear) query += `year=${selectedYear}`;

      const [txData, accData, catData] = await Promise.all([
        fetchApi(`/transactions?${query}`),
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
        recurrenceFrequency: formData.recurring ? (formData.recurrenceFrequency || "MONTHLY") : null,
        paid: formData.paid !== undefined ? formData.paid : true,
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
    try {
      await fetchApi(`/transactions/${id}`, { method: "DELETE" });
      loadAllData();
    } catch (error) {
      console.error(error);
      alert("Erro ao deletar");
    }
  };

  const handleProcessRecurrence = async (id: number) => {
    try {
      await fetchApi(`/transactions/${id}/process-recurrence`, { method: "POST" });
      loadAllData();
      alert("Transação recorrente lançada com sucesso! Um novo lançamento foi criado no histórico.");
    } catch (error) {
      console.error(error);
      alert("Erro ao processar transação recorrente");
    }
  };

  const handleTogglePaid = async (tx: Transaction) => {
    try {
      const payload = {
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        recurring: tx.recurring,
        paid: true,
        account: { id: tx.account.id },
        category: { id: tx.category?.id }
      };
      await fetchApi(`/transactions/${tx.id}`, { method: "PUT", body: JSON.stringify(payload) });
      loadAllData();
    } catch (e) {
      console.error(e);
      alert("Erro ao efetivar transação");
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === "history" && tx.recurring) return false;
    if (activeTab === "recurring" && !tx.recurring) return false;

    const term = searchTerm.toLowerCase();
    const descMatch = tx.description.toLowerCase().includes(term);
    const catMatch = tx.category?.name?.toLowerCase().includes(term);
    const accMatch = tx.account?.name?.toLowerCase().includes(term);
    return descMatch || catMatch || accMatch;
  });

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Nenhuma transação para exportar");
      return;
    }

    const headers = ["Descrição", "Categoria", "Conta", "Data", "Tipo", "Valor (R$)"];
    const rows = filteredTransactions.map(tx => [
      tx.description,
      tx.category?.name || "Sem Categoria",
      tx.account?.name || "Sem Conta",
      tx.date,
      tx.type === "INCOME" ? "Receita" : "Despesa",
      tx.amount.toFixed(2).replace(".", ",")
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(e => e.join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const filename = `transacoes_${selectedMonth ? String(selectedMonth).padStart(2, '0') : 'todos'}_${selectedYear || 'todos'}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                recurring: false, paid: true, accountId: accounts[0]?.id || "", categoryId: categories[0]?.id || "" 
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </header>

        {/* Alternador de Abas */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Lançamentos Efetivados
          </button>
          <button
            onClick={() => setActiveTab("recurring")}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "recurring"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            Assinaturas & Recorrências
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-10">Carregando...</div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/20">
              <input 
                type="text" 
                placeholder="Buscar transação..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary w-64 text-foreground"
              />
              <div className="flex gap-4 items-center">
                <select 
                  value={selectedMonth}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedMonth(val === "" ? "" : Number(val));
                  }}
                  className="bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="">Todos os meses</option>
                  {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
                    .map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select 
                  value={selectedYear}
                  onChange={e => {
                    const val = e.target.value;
                    const yearVal = val === "" ? "" : Number(val);
                    setSelectedYear(yearVal);
                    if (yearVal === "") {
                      setSelectedMonth("");
                    }
                  }}
                  className="bg-input border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="">Todos os anos</option>
                  {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                {(selectedMonth !== "" || selectedYear !== "" || searchTerm !== "") && (
                  <button
                    onClick={() => {
                      setSelectedMonth("");
                      setSelectedYear("");
                      setSearchTerm("");
                    }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2 transition-colors"
                    title="Limpar filtros"
                  >
                    <X className="w-3.5 h-3.5" />
                    Limpar Filtros
                  </button>
                )}

                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 text-xs text-primary-foreground bg-primary hover:bg-blue-600 border border-transparent rounded-lg px-3 py-2 transition-colors font-medium"
                  title="Exportar para Planilha (.csv)"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-border">Descrição</th>
                  <th className="p-4 font-medium border-b border-border">Categoria / Conta</th>
                  <th className="p-4 font-medium border-b border-border">
                    {activeTab === "history" ? "Data" : "Próximo Lançamento"}
                  </th>
                  {activeTab === "recurring" && (
                    <th className="p-4 font-medium border-b border-border">Status</th>
                  )}
                  <th className="p-4 font-medium border-b border-border text-right">Valor</th>
                  <th className="p-4 font-medium border-b border-border text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((tx) => {
                  let isOverdue = false;
                  if (tx.recurring && tx.nextRecurrenceDate) {
                    const todayStr = new Date().toISOString().split("T")[0];
                    isOverdue = tx.nextRecurrenceDate <= todayStr;
                  }

                  return (
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
                              {!tx.paid && activeTab === "history" && (
                                <span title="Agendada / Pendente" className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded uppercase font-bold ml-1"><Clock className="w-3 h-3" /> Pendente</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: tx.category?.color || "#9ca3af" }}
                          />
                          <div className="text-sm">
                            <span className="font-medium">{tx.category?.name || "Sem Categoria"}</span>
                            <span className="text-muted-foreground block text-xs">{tx.account?.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {activeTab === "history" ? tx.date : tx.nextRecurrenceDate || tx.date}
                      </td>
                      {activeTab === "recurring" && (
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isOverdue
                              ? "bg-red-500/10 text-red-500 animate-pulse"
                              : "bg-green-500/10 text-green-500"
                          }`}>
                            {isOverdue ? "Pendente" : "Agendado"}
                          </span>
                        </td>
                      )}
                      <td className="p-4 text-right">
                        <span className={`font-bold ${tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {!tx.paid && activeTab === "history" && (
                            <button
                              onClick={() => handleTogglePaid(tx)}
                              className="p-2 bg-secondary text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                              title="Marcar como Efetivado (Pago/Recebido)"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {activeTab === "recurring" && (
                            <button
                              onClick={() => tx.id && handleProcessRecurrence(tx.id)}
                              className="p-2 bg-secondary text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                              title="Lançar transação agora"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setFormData({
                                id: tx.id, description: tx.description, amount: tx.amount, type: tx.type, 
                                date: tx.date, recurring: tx.recurring, 
                                recurrenceFrequency: (tx as any).recurrenceFrequency || "MONTHLY",
                                paid: tx.paid !== undefined ? tx.paid : true, accountId: tx.account?.id, categoryId: tx.category?.id
                              });
                              setShowModal(true);
                            }}
                            className="p-2 bg-secondary text-muted-foreground hover:text-primary rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => tx.id && handleDelete(tx.id)}
                            className="p-2 bg-secondary text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={activeTab === "recurring" ? 6 : 5} className="p-8 text-center text-muted-foreground">
                      {transactions.length === 0 ? "Nenhuma transação encontrada." : "Nenhum resultado corresponde à sua busca."}
                    </td>
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
                      onChange={e => setFormData({...formData, recurring: e.target.checked, recurrenceFrequency: e.target.checked ? (formData.recurrenceFrequency || "MONTHLY") : ""})}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="recurring" className="text-sm text-foreground">É recorrente?</label>
                  </div>

                  {/* Frequência de recorrência — aparece somente quando marcado */}
                  {formData.recurring && (
                    <div className="col-span-2">
                      <label className="block text-sm text-muted-foreground mb-2">Frequência de Repetição</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "MONTHLY", label: "📅 Mensal", subtitle: "Mesma data todo mês" },
                          { value: "LAST_DAY", label: "🗓️ Fim do Mês", subtitle: "Último dia (28, 30, 31...)" },
                          { value: "LAST_BUSINESS_DAY", label: "💼 Último Dia Útil", subtitle: "Última Seg–Sex do mês" },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormData({...formData, recurrenceFrequency: opt.value})}
                            className={`flex flex-col items-center text-center p-3 rounded-xl border-2 text-xs font-semibold transition-all gap-1 ${
                              (formData.recurrenceFrequency || "MONTHLY") === opt.value
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-secondary/20 text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            <span className="text-base">{opt.label}</span>
                            <span className="text-[10px] font-normal leading-tight opacity-70">{opt.subtitle}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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

                  {/* Status de Pagamento */}
                  <div className="col-span-2">
                    <label className="block text-sm text-muted-foreground mb-2">Status do Pagamento</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paid: true})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formData.paid
                            ? "border-green-500 bg-green-500/10 text-green-500"
                            : "border-border bg-secondary/30 text-muted-foreground hover:border-green-500/50"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Efetivada / Paga
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paid: false})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          !formData.paid
                            ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                            : "border-border bg-secondary/30 text-muted-foreground hover:border-yellow-500/50"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        Agendada / Pendente
                      </button>
                    </div>
                    {!formData.paid && (
                      <p className="text-xs text-yellow-500/80 mt-2 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        Esta transação ficará visível na lista, mas não afetará os totais do Dashboard até ser efetivada.
                      </p>
                    )}
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
