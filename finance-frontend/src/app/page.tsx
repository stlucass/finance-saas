"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
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

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  // Filtros de tempo
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);

  // Estados dos dados brutos
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);

  // Estados dos filtros ativos
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]); // usar ID, e -1 para "Sem Categoria"

  // Função para recalcular métricas baseando-se nos filtros ativos
  const calculateMetrics = (
    transactions: any[],
    accounts: any[],
    activeAccounts: number[],
    activeCategories: number[]
  ) => {
    // 1. Calcula saldo total das contas selecionadas
    let totalBalance = 0;
    accounts.forEach((acc: any) => {
      if (activeAccounts.includes(acc.id)) {
        totalBalance += acc.balance;
      }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const barDataMap: Record<string, any> = {};
    const pieDataMap: Record<string, { value: number; color: string }> = {};

    // 2. Filtra transações correspondentes a contas e categorias selecionadas
    transactions.forEach((tx: any) => {
      const accountId = tx.account?.id;
      const categoryId = tx.category?.id || -1; // -1 para sem categoria

      const isAccountActive = activeAccounts.includes(accountId);
      const isCategoryActive = activeCategories.includes(categoryId);

      if (isAccountActive && isCategoryActive) {
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
          const catColor = tx.category?.color || "#9ca3af";
          if (!pieDataMap[catName]) {
            pieDataMap[catName] = { value: 0, color: catColor };
          }
          pieDataMap[catName].value += tx.amount;
        }
      }
    });

    const sortedBarData = Object.values(barDataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
    const finalPieData = Object.keys(pieDataMap).map(key => ({
      name: key,
      value: pieDataMap[key].value,
      color: pieDataMap[key].color
    }));

    setBalance(totalBalance);
    setIncome(totalIncome);
    setExpense(totalExpense);
    setBarData(sortedBarData);
    setPieData(finalPieData);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [txData, accountsData, categoriesData] = await Promise.all([
        fetchApi(`/transactions?month=${selectedMonth}&year=${selectedYear}`),
        fetchApi("/accounts"),
        fetchApi("/categories")
      ]);

      setRawTransactions(txData);
      setAllAccounts(accountsData);
      setAllCategories(categoriesData);

      // Define seleções padrão na primeira inicialização ou se a lista atual de IDs de contas selecionadas estiver vazia
      setSelectedAccounts(prev => {
        if (prev.length === 0) {
          return accountsData.map((a: any) => a.id);
        }
        // Garante que só mantemos contas existentes no novo array
        const validIds = accountsData.map((a: any) => a.id);
        return prev.filter(id => validIds.includes(id));
      });

      setSelectedCategories(prev => {
        const validIds = [...categoriesData.map((c: any) => c.id), -1];
        if (prev.length === 0) {
          return validIds;
        }
        return prev.filter(id => validIds.includes(id));
      });

      // Cálculo imediato para o primeiro render
      const activeAccs = selectedAccounts.length === 0 ? accountsData.map((a: any) => a.id) : selectedAccounts;
      const activeCats = selectedCategories.length === 0 ? [...categoriesData.map((c: any) => c.id), -1] : selectedCategories;

      calculateMetrics(txData, accountsData, activeAccs, activeCats);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dispara a busca sempre que alterar o mês ou o ano
  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth, selectedYear]);

  // Dispara o recálculo local no frontend sempre que os filtros mudarem
  useEffect(() => {
    if (rawTransactions.length > 0 || allAccounts.length > 0) {
      calculateMetrics(rawTransactions, allAccounts, selectedAccounts, selectedCategories);
    }
  }, [selectedAccounts, selectedCategories, rawTransactions, allAccounts]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Visão geral das suas finanças.</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Seletores de Mês e Ano */}
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-card border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
            >
              {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
                .map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-card border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            
            {/* Botão de Filtros Avançados */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "bg-card border-border hover:bg-secondary/30 text-foreground"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Painel de Filtros Avançados Retrátil */}
        {showFilters && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8 shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Filtrar por Contas</h4>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setSelectedAccounts(allAccounts.map(a => a.id))}
                      className="text-xs text-primary hover:underline"
                    >
                      Selecionar Todas
                    </button>
                    <span className="text-muted-foreground text-xs">|</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedAccounts([])}
                      className="text-xs text-primary hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                  {allAccounts.map(acc => (
                    <label 
                      key={acc.id} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                        selectedAccounts.includes(acc.id)
                          ? "bg-primary/10 border-primary text-foreground"
                          : "bg-secondary/35 border-border hover:border-muted-foreground text-muted-foreground"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedAccounts.includes(acc.id)}
                        onChange={() => {
                          setSelectedAccounts(prev => 
                            prev.includes(acc.id) 
                              ? prev.filter(id => id !== acc.id) 
                              : [...prev, acc.id]
                          );
                        }}
                        className="sr-only"
                      />
                      <span>{acc.name}</span>
                    </label>
                  ))}
                  {allAccounts.length === 0 && (
                    <span className="text-muted-foreground text-sm">Nenhuma conta cadastrada.</span>
                  )}
                </div>
              </div>

              {/* Categorias */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Filtrar por Categorias</h4>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setSelectedCategories([...allCategories.map(c => c.id), -1])}
                      className="text-xs text-primary hover:underline"
                    >
                      Selecionar Todas
                    </button>
                    <span className="text-muted-foreground text-xs">|</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-primary hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                  {allCategories.map(cat => (
                    <label 
                      key={cat.id} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                        selectedCategories.includes(cat.id)
                          ? "bg-primary/10 border-primary text-foreground"
                          : "bg-secondary/35 border-border hover:border-muted-foreground text-muted-foreground"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => {
                          setSelectedCategories(prev => 
                            prev.includes(cat.id) 
                              ? prev.filter(id => id !== cat.id) 
                              : [...prev, cat.id]
                          );
                        }}
                        className="sr-only"
                      />
                      {cat.color && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      )}
                      <span>{cat.name}</span>
                    </label>
                  ))}
                  
                  {/* Sem Categoria */}
                  <label 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      selectedCategories.includes(-1)
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-secondary/35 border-border hover:border-muted-foreground text-muted-foreground"
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(-1)}
                      onChange={() => {
                        setSelectedCategories(prev => 
                          prev.includes(-1) 
                            ? prev.filter(id => id !== -1) 
                            : [...prev, -1]
                        );
                      }}
                      className="sr-only"
                    />
                    <span className="w-2 h-2 rounded-full bg-muted shrink-0" />
                    <span>Sem Categoria</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

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
                            <Cell key={`cell-${index}`} fill={entry.color} />
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
