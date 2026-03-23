import { useState, useMemo } from 'react';
import { PinGuard } from '@/components/PinGuard';
import { DateFilter, filterByDate } from '@/components/DateFilter';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/format';
import { startOfDay, endOfDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, CreditCard } from 'lucide-react';

const CHART_COLORS = [
  'hsl(0,72%,51%)', 'hsl(142,71%,45%)', 'hsl(217,91%,60%)',
  'hsl(45,93%,47%)', 'hsl(280,70%,50%)', 'hsl(25,95%,53%)',
];

const tooltipStyle = {
  background: 'hsl(0,0%,9%)',
  border: '1px solid hsl(0,0%,16%)',
  borderRadius: 8,
  fontSize: 12,
};

export default function Dashboard() {
  const { sales, cashRegister, products } = useStore();
  const [dateRange, setDateRange] = useState({ start: startOfDay(new Date()), end: endOfDay(new Date()) });

  const filtered = useMemo(
    () => filterByDate(sales.filter(s => !s.cancelled), dateRange.start, dateRange.end),
    [sales, dateRange]
  );

  const totalRevenue = filtered.reduce((s, sale) => s + sale.total, 0);
  const totalCost = filtered.reduce((s, sale) => s + sale.items.reduce((c, i) => {
    const cost = i.product.category === 'pizza' && i.pizzaSize && i.product.pizzaCosts
      ? i.product.pizzaCosts[i.pizzaSize] : i.product.cost;
    return c + cost * i.quantity;
  }, 0), 0);
  const profit = totalRevenue - totalCost;
  const avgTicket = filtered.length > 0 ? totalRevenue / filtered.length : 0;
  const totalItems = filtered.reduce((s, sale) => s + sale.items.reduce((c, i) => c + i.quantity, 0), 0);
  const isOpen = cashRegister && !cashRegister.closedAt;

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => s.items.forEach(i => {
      map[i.product.category] = (map[i.product.category] || 0) + i.calculatedPrice * i.quantity;
    }));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const dailyData = useMemo(() => {
    const map: Record<string, { revenue: number; cost: number }> = {};
    filtered.forEach(s => {
      const d = new Date(s.date).toLocaleDateString('pt-BR');
      if (!map[d]) map[d] = { revenue: 0, cost: 0 };
      map[d].revenue += s.total;
      map[d].cost += s.items.reduce((c, i) => {
        const cost = i.product.category === 'pizza' && i.pizzaSize && i.product.pizzaCosts
          ? i.product.pizzaCosts[i.pizzaSize] : i.product.cost;
        return c + cost * i.quantity;
      }, 0);
    });
    return Object.entries(map).map(([date, v]) => ({ date, ...v, profit: v.revenue - v.cost }));
  }, [filtered]);

  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => s.payments.forEach(p => {
      map[p.method] = (map[p.method] || 0) + p.amount;
    }));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filtered.forEach(s => s.items.forEach(i => {
      const key = i.product.id;
      if (!map[key]) map[key] = { name: i.product.name, qty: 0, revenue: 0 };
      map[key].qty += i.quantity;
      map[key].revenue += i.calculatedPrice * i.quantity;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filtered]);

  const PAYMENT_LABELS: Record<string, string> = {
    dinheiro: '💵 Dinheiro', pix: '📱 Pix',
    debito: '💳 Débito', credito: '💳 Crédito',
  };

  return (
    <PinGuard title="Dashboard">
      <div className="p-4 space-y-5 animate-fade-in max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`status-badge ${isOpen ? 'status-open' : 'status-closed'}`}>
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
              Caixa {isOpen ? 'Aberto' : 'Fechado'}
            </div>
            <DateFilter onFilter={(s, e) => setDateRange({ start: s, end: e })} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="kpi-card kpi-info">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Vendas</p>
              <ShoppingCart className="w-4 h-4 text-info" />
            </div>
            <p className="text-3xl font-extrabold text-info">{filtered.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{totalItems} itens vendidos</p>
          </div>
          <div className="kpi-card kpi-primary">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Faturamento</p>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-extrabold text-primary">{formatCurrency(totalRevenue)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Ticket médio: {formatCurrency(avgTicket)}</p>
          </div>
          <div className="kpi-card kpi-destructive">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Custo</p>
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-3xl font-extrabold text-destructive">{formatCurrency(totalCost)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Margem: {totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0'}%
            </p>
          </div>
          <div className="kpi-card kpi-success">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Lucro</p>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <p className={`text-3xl font-extrabold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(profit)}
            </p>
          </div>
          <div className="kpi-card kpi-warning">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Produtos</p>
              <Package className="w-4 h-4 text-warning" />
            </div>
            <p className="text-3xl font-extrabold text-warning">{products.filter(p => p.active).length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Ativos no catálogo</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 glass-card p-5">
            <h3 className="text-sm font-bold mb-4">Receita & Lucro por Período</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0,72%,51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0,72%,51%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,16%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(0,0%,55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,55%)' }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="revenue" name="Receita" stroke="hsl(0,72%,51%)" fill="url(#gradRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Lucro" stroke="hsl(142,71%,45%)" fill="url(#gradProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4">Por Categoria</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                  {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Payment Methods */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Formas de Pagamento
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentData.map((p) => (
                <div key={p.name} className="bg-secondary rounded-lg p-3 flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">{PAYMENT_LABELS[p.name] || p.name}</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(p.value)}</p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalRevenue > 0 ? (p.value / totalRevenue) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
              {paymentData.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-6">Sem dados</p>}
            </div>
          </div>

          {/* Top Products */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold mb-4">🏆 Produtos Mais Vendidos</h3>
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-2.5">
                  <span className="text-lg font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.qty} unidade{p.qty > 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-sm font-bold text-primary">{formatCurrency(p.revenue)}</p>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sem dados</p>}
            </div>
          </div>
        </div>
      </div>
    </PinGuard>
  );
}
