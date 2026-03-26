import { useState, useMemo } from 'react';
import { PinGuard } from '@/components/PinGuard';
import { DateFilter, filterByDate } from '@/components/DateFilter';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/format';
import { startOfDay, endOfDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, CreditCard, Receipt, Pizza } from 'lucide-react';

const CHART_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--info))',
  'hsl(var(--warning))', 'hsl(280,70%,50%)', 'hsl(25,95%,53%)',
];

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--foreground))',
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
    {message}
  </div>
);

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
    return c + (cost || 0) * i.quantity;
  }, 0), 0);
  const profit = totalRevenue - totalCost;
  const avgTicket = filtered.length > 0 ? totalRevenue / filtered.length : 0;
  const totalItems = filtered.reduce((s, sale) => s + sale.items.reduce((c, i) => c + i.quantity, 0), 0);
  const isOpen = cashRegister && !cashRegister.closedAt;
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0';

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
        return c + (cost || 0) * i.quantity;
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

  // Top 3 pizzas - 1 flavor
  const top1Flavor = useMemo(() => {
    const map: Record<string, { name: string; qty: number }> = {};
    filtered.forEach(s => s.items.forEach(i => {
      if (i.product.category === 'pizza' && !i.secondFlavor) {
        const key = i.product.id;
        if (!map[key]) map[key] = { name: i.product.name, qty: 0 };
        map[key].qty += i.quantity;
      }
    }));
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 3);
  }, [filtered]);

  // Top 3 pizzas - 2 flavors
  const top2Flavors = useMemo(() => {
    const map: Record<string, { name: string; qty: number }> = {};
    filtered.forEach(s => s.items.forEach(i => {
      if (i.product.category === 'pizza' && i.secondFlavor) {
        const key = `${i.product.name} / ${i.secondFlavor.name}`;
        if (!map[key]) map[key] = { name: key, qty: 0 };
        map[key].qty += i.quantity;
      }
    }));
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 3);
  }, [filtered]);

  const PAYMENT_LABELS: Record<string, string> = {
    dinheiro: 'Dinheiro', pix: 'Pix',
    debito: 'Débito', credito: 'Crédito',
  };

  const noData = filtered.length === 0;

  return (
    <PinGuard title="Dashboard">
      <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Visão geral do seu negócio</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`status-badge ${isOpen ? 'status-open' : 'status-closed'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-success' : 'bg-destructive'}`} />
              Caixa {isOpen ? 'Aberto' : 'Fechado'}
            </div>
            <DateFilter onFilter={(s, e) => setDateRange({ start: s, end: e })} />
          </div>
        </div>

        {noData && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-center">
            <p className="text-sm text-warning font-medium">Nenhum dado encontrado neste período</p>
            <p className="text-xs text-muted-foreground mt-1">Tente alterar o filtro de datas</p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard label="Vendas" value={String(filtered.length)} sub={`${totalItems} itens vendidos`} icon={<ShoppingCart className="w-4 h-4" />} variant="info" />
          <KpiCard label="Faturamento" value={formatCurrency(totalRevenue)} sub={`Ticket médio: ${formatCurrency(avgTicket)}`} icon={<DollarSign className="w-4 h-4" />} variant="primary" />
          <KpiCard label="Custo" value={formatCurrency(totalCost)} sub={`Margem: ${margin}%`} icon={<TrendingDown className="w-4 h-4" />} variant="destructive" />
          <KpiCard label="Lucro" value={formatCurrency(profit)} icon={<TrendingUp className="w-4 h-4" />} variant={profit >= 0 ? 'success' : 'destructive'} />
          <KpiCard label="Produtos Ativos" value={String(products.filter(p => p.active).length)} sub="No catálogo" icon={<Package className="w-4 h-4" />} variant="warning" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Receita & Lucro</h3>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} allowDataOverflow={false} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="revenue" name="Receita" stroke="hsl(var(--primary))" fill="url(#gradRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name="Lucro" stroke="hsl(var(--success))" fill="url(#gradProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Nenhum dado encontrado neste período" />
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Por Categoria</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                    {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Nenhum dado encontrado neste período" />
            )}
          </div>
        </div>

        {/* Top Pizzas + Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top Pizzas */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Pizza className="w-3.5 h-3.5" /> Pizzas Mais Vendidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1 Flavor */}
              <div>
                <p className="text-[11px] font-semibold text-foreground mb-2">🍕 Mais vendidas (1 sabor)</p>
                {top1Flavor.length > 0 ? (
                  <div className="space-y-1.5">
                    {top1Flavor.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 border border-border/50">
                        <span className="text-xs font-bold text-primary w-5 text-center">{i + 1}º</span>
                        <span className="text-xs font-medium flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{p.qty}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">Sem dados</p>
                )}
              </div>
              {/* 2 Flavors */}
              <div>
                <p className="text-[11px] font-semibold text-foreground mb-2">🍕🍕 Mais vendidas (2 sabores)</p>
                {top2Flavors.length > 0 ? (
                  <div className="space-y-1.5">
                    {top2Flavors.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 border border-border/50">
                        <span className="text-xs font-bold text-info w-5 text-center">{i + 1}º</span>
                        <span className="text-xs font-medium flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{p.qty}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">Sem dados</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" /> Formas de Pagamento
            </h3>
            {paymentData.length > 0 ? (
              <div className="space-y-3">
                {paymentData.map((p) => {
                  const pct = totalRevenue > 0 ? (p.value / totalRevenue) * 100 : 0;
                  return (
                    <div key={p.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{PAYMENT_LABELS[p.name] || p.name}</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(p.value)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right">{pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="Nenhum dado encontrado neste período" />
            )}
          </div>
        </div>
      </div>
    </PinGuard>
  );
}

function KpiCard({ label, value, sub, icon, variant }: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  variant: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
}) {
  const colorMap = {
    primary: { text: 'text-primary', border: 'border-primary/20', bg: 'bg-primary/5', bar: 'bg-primary' },
    success: { text: 'text-success', border: 'border-success/20', bg: 'bg-success/5', bar: 'bg-success' },
    warning: { text: 'text-warning', border: 'border-warning/20', bg: 'bg-warning/5', bar: 'bg-warning' },
    info: { text: 'text-info', border: 'border-info/20', bg: 'bg-info/5', bar: 'bg-info' },
    destructive: { text: 'text-destructive', border: 'border-destructive/20', bg: 'bg-destructive/5', bar: 'bg-destructive' },
  };
  const c = colorMap[variant];

  return (
    <div className={`bg-card border ${c.border} rounded-lg p-4 relative overflow-hidden transition-all duration-200 hover:shadow-md`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <div className={`${c.text} opacity-60`}>{icon}</div>
      </div>
      <p className={`text-2xl font-extrabold ${c.text} tabular-nums leading-tight`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
