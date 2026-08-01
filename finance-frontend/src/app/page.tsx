"use client";

import { Sidebar } from "@/components/Sidebar";
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";
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
  Legend,
  AreaChart,
  Area
} from "recharts";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  // Filtros de tempo
  const [selectedMonth, setSelectedMonth] = useState<number | "">(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number | "">(new Date().getFullYear());
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
    categoriesList: any[],
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
    const categoryExpensesMap: Record<number, number> = {};

    // Estruturas para o Gráfico Anual/Evolução
    const MONTHS_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // Se ano estiver selecionado, inicia com os 12 meses
    const evolutionMonthly = MONTHS_NAMES.map(m => ({ name: m, Receitas: 0, Despesas: 0 }));
    const evolutionYearlyMap: Record<string, { name: string, Receitas: number, Despesas: number }> = {};

    // 2. Filtra transações correspondentes a contas e categorias selecionadas
    transactions.forEach((tx: any) => {
      const accountId = tx.account?.id;
      const categoryId = tx.category?.id || -1; // -1 para sem categoria

      const isAccountActive = activeAccounts.includes(accountId);
      const isCategoryActive = activeCategories.includes(categoryId);

      if (isAccountActive && isCategoryActive) {
        // Extrai ano e mês de forma segura
        const [txYear, txMonth] = tx.date.split("-").map(Number);

        // A. Agrupamento para Evolução Anual
        if (selectedYear !== "") {
          if (txYear === selectedYear) {
            const monthIdx = txMonth - 1;
            if (monthIdx >= 0 && monthIdx < 12) {
              if (tx.type === "INCOME") evolutionMonthly[monthIdx].Receitas += tx.amount;
              if (tx.type === "EXPENSE") evolutionMonthly[monthIdx].Despesas += tx.amount;
            }
          }
        } else {
          const yearStr = String(txYear);
          if (!evolutionYearlyMap[yearStr]) {
            evolutionYearlyMap[yearStr] = { name: yearStr, Receitas: 0, Despesas: 0 };
          }
          if (tx.type === "INCOME") evolutionYearlyMap[yearStr].Receitas += tx.amount;
          if (tx.type === "EXPENSE") evolutionYearlyMap[yearStr].Despesas += tx.amount;
        }

        // B. Filtros do Mês ativo para os Cards, Fluxo Diário e Gráfico de Pizza
        const isMonthMatch = selectedMonth === "" || txMonth === selectedMonth;

        if (isMonthMatch) {
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
      }

      // C. Para Orçamentos: Calcula despesas apenas das contas ativas no mês ativo do ano selecionado
      if (isAccountActive) {
        const [txYear, txMonth] = tx.date.split("-").map(Number);
        const isMonthMatch = selectedMonth === "" || txMonth === selectedMonth;
        const isYearMatch = selectedYear === "" || txYear === selectedYear;

        if (isMonthMatch && isYearMatch) {
          if (tx.type === "EXPENSE") {
            categoryExpensesMap[categoryId] = (categoryExpensesMap[categoryId] || 0) + tx.amount;
          }
        }
      }
    });

    const sortedBarData = Object.values(barDataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
    
    // Calcula o Fluxo de Caixa Diário (Linha/Área)
    let currentCumulative = 0;
    const finalLineData = sortedBarData.map((dayData: any) => {
      const netVariation = dayData.Receitas - dayData.Despesas;
      currentCumulative += netVariation;
      return {
        name: dayData.name.split("-").slice(1).reverse().join("/"), // Transforma YYYY-MM-DD em DD/MM
        "Acumulado": currentCumulative,
        fullDate: dayData.name
      };
    });

    const finalPieData = Object.keys(pieDataMap).map(key => ({
      name: key,
      value: pieDataMap[key].value,
      color: pieDataMap[key].color
    }));

    // Formata o gráfico de evolução anual
    let finalEvolutionData: any[] = [];
    if (selectedYear !== "") {
      finalEvolutionData = evolutionMonthly;
    } else {
      finalEvolutionData = Object.keys(evolutionYearlyMap)
        .sort((a, b) => a.localeCompare(b))
        .map(key => evolutionYearlyMap[key]);
    }

    // 4. Mapeia categorias que possuem limite cadastrado para os Orçamentos
    const calculatedBudgets = categoriesList
      .filter((cat: any) => cat.type === "EXPENSE" && cat.monthlyLimit && cat.monthlyLimit > 0)
      .map((cat: any) => {
        const spent = categoryExpensesMap[cat.id] || 0;
        const percentage = (spent / cat.monthlyLimit) * 100;
        return {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          limit: cat.monthlyLimit,
          spent,
          percentage
        };
      });

    setBalance(totalBalance);
    setIncome(totalIncome);
    setExpense(totalExpense);
    setBarData(sortedBarData);
    setLineData(finalLineData);
    setPieData(finalPieData);
    setBudgets(calculatedBudgets);
    setYearlyData(finalEvolutionData);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      let query = "";
      if (selectedYear) query += `year=${selectedYear}`;

      const [txData, accountsData, categoriesData] = await Promise.all([
        fetchApi(`/transactions?${query}`),
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

      calculateMetrics(txData, accountsData, categoriesData, activeAccs, activeCats);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dispara a busca sempre que alterar o ano
  useEffect(() => {
    loadDashboardData();
  }, [selectedYear]);

  // Dispara o recálculo local no frontend sempre que os filtros, dados brutos ou mês mudarem
  useEffect(() => {
    if (rawTransactions.length > 0 || allAccounts.length > 0) {
      calculateMetrics(rawTransactions, allAccounts, allCategories, selectedAccounts, selectedCategories);
    }
  }, [selectedAccounts, selectedCategories, selectedMonth, rawTransactions, allAccounts, allCategories]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Visão geral das suas finanças.</p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* Seletores de Mês e Ano */}
            <select
              value={selectedMonth}
              onChange={e => {
                const val = e.target.value;
                setSelectedMonth(val === "" ? "" : Number(val));
              }}
              className="bg-card border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
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
              className="bg-card border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary text-foreground"
            >
              <option value="">Todos os anos</option>
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            {(selectedMonth !== "" || selectedYear !== "") && (
              <button
                onClick={() => {
                  setSelectedMonth("");
                  setSelectedYear("");
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary/40 border border-border rounded-lg px-3 py-2 transition-colors"
                title="Limpar filtros"
              >
                <X className="w-3.5 h-3.5" />
                Limpar Filtros
              </button>
            )}
            
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
                    <p className="text-sm font-medium text-muted-foreground">
                      {selectedMonth !== "" ? "Saldo Total Contas" : "Saldo Consolidado do Período"}
                    </p>
                    <h3 className="text-3xl font-bold mt-1">R$ {balance.toFixed(2)}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ArrowUpRight className="w-24 h-24 text-green-500" />
                </div>
                <div className="flex flex-col relative z-10">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {selectedMonth !== "" ? "Total de Entradas" : "Total Entradas no Ano"}
                  </p>
                  <h3 className="text-3xl font-bold text-green-500">R$ {income.toFixed(2)}</h3>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ArrowDownRight className="w-24 h-24 text-red-500" />
                </div>
                <div className="flex flex-col relative z-10">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {selectedMonth !== "" ? "Total de Saídas" : "Total Saídas no Ano"}
                  </p>
                  <h3 className="text-3xl font-bold text-red-500">R$ {expense.toFixed(2)}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-lg">
                <h3 className="text-lg font-bold mb-6">
                  {selectedMonth !== "" ? "Fluxo de Caixa Diário" : "Fluxo Diário Acumulado"}
                </h3>
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
                      Nenhum dado registrado para este mês.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border shadow-lg">
                <h3 className="text-lg font-bold mb-6">
                  {selectedMonth !== "" ? "Despesas por Categoria" : "Despesas por Categoria no Ano"}
                </h3>
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
                      Nenhuma despesa registrada para este mês.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Gráfico de Evolução do Saldo Acumulado (Linha) */}
            <div className="mt-8 bg-card p-6 rounded-2xl border border-border shadow-lg">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {selectedMonth !== "" ? "Evolução do Fluxo de Caixa (Acumulado Diário)" : "Evolução do Fluxo de Caixa (Acumulado do Ano)"}
              </h3>
              <div className="h-[320px] w-full">
                {lineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                        labelFormatter={(label, payload) => payload.length > 0 ? `Data: ${payload[0].payload.fullDate}` : label}
                      />
                      <Area type="monotone" dataKey="Acumulado" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAcumulado)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum dado para o período filtrado.
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de Evolução Anual/Histórico */}
            <div className="mt-8 bg-card p-6 rounded-2xl border border-border shadow-lg">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {selectedYear !== "" ? `Evolução de Receitas vs Despesas de ${selectedYear} (Mensal)` : "Evolução Financeira Histórica (Anual)"}
              </h3>
              <div className="h-[320px] w-full">
                {yearlyData.length > 0 && yearlyData.some(d => d.Receitas > 0 || d.Despesas > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum dado registrado para o período selecionado.
                  </div>
                )}
              </div>
            </div>

            {/* Orçamentos e Metas de Gastos */}
            {budgets.length > 0 && (
              <div className="mt-8 bg-card p-6 rounded-2xl border border-border shadow-lg">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Orçamentos e Metas de Gastos {selectedMonth !== "" ? "do Mês" : "do Ano"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {budgets.map((budget) => {
                    const isOverLimit = budget.spent > budget.limit;
                    const percentText = `${Math.round(budget.percentage)}%`;
                    const barWidth = `${Math.min(budget.percentage, 100)}%`;

                    return (
                      <div 
                        key={budget.id} 
                        className={`bg-secondary/15 rounded-xl border p-5 transition-all duration-300 relative overflow-hidden ${
                          isOverLimit 
                            ? "border-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.07)]" 
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        {/* Indicador de estouro com efeito pulsante */}
                        {isOverLimit && (
                          <span className="absolute top-0 right-0 mt-3 mr-3 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}

                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: budget.color }} 
                            />
                            <span className="font-semibold text-sm text-foreground">{budget.name}</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isOverLimit ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                          }`}>
                            {percentText}
                          </span>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverLimit ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : ""
                            }`}
                            style={{ 
                              width: barWidth, 
                              backgroundColor: isOverLimit ? undefined : budget.color 
                            }}
                          />
                        </div>

                        {/* Detalhes do Valor */}
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Gasto: <strong className="text-foreground">R$ {budget.spent.toFixed(2)}</strong>
                          </span>
                          <span className="text-muted-foreground">
                            Limite: <strong className="text-foreground">R$ {budget.limit.toFixed(2)}</strong>
                          </span>
                        </div>

                        {/* Mensagem de alerta se ultrapassou */}
                        {isOverLimit && (
                          <div className="mt-3 text-[11px] font-medium text-red-500 flex items-center gap-1">
                            ⚠️ Limite excedido em R$ {(budget.spent - budget.limit).toFixed(2)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
