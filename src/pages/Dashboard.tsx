import { useState, useMemo } from 'react';
import { PinGuard } from '@/components/PinGuard';
import { DateFilter, filterByDate } from '@/components/DateFilter';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/lib/format';
import { startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(25,95%,53%)', 'hsl(142,71%,45%)', 'hsl(217,91%,60%)', 'hsl(45,93%,47%)', 'hsl(0,84%,60%)', 'hsl(280,70%,50%)'];

export default function Dashboard() {
  const { sales } = useStore();
  const [dateRange, setDateRange] = useState({ start: startOfDay(new Date()), end: endOfDay(new Date()) });

  const filtered = useMemo(() => filterByDate(sales.filter(s => !s.cancelled), dateRange.start, dateRange.end), [sales, dateRange]);

  const totalRevenue = filtered.reduce((s, sale) => s + sale.total, 0);
  const totalCost = filtered.reduce((s, sale) => s + sale.items.reduce((c, i) => {
    const cost = i.product.category === 'pizza' && i.pizzaSize && i.product.pizzaCosts ? i.product.pizzaCosts[i.pizzaSize] : i.product.cost;
    return c + cost * i.quantity;
  }, 0), 0);
  const profit = totalRevenue - totalCost;

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => s.items.forEach(i => { map[i.product.category] = (map[i.product.category] || 0) + i.calculatedPrice * i.quantity; }));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => { const d = new Date(s.date).toLocaleDateString('pt-BR'); map[d] = (map[d] || 0) + s.total; });
    return Object.entries(map).map(([date, total]) => ({ date, total }));
  }, [filtered]);

  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => s.payments.forEach(p => { map[p.method] = (map[p.method] || 0) + p.amount; }));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  return (
    <PinGuard title="Dashboard">
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">📊 Dashboard</h1>
          <DateFilter onFilter={(s, e) => setDateRange({ start: s, end: e })} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-card p-4"><p className="text-xs text-muted-foreground">Vendas</p><p className="text-2xl font-bold text-info">{filtered.length}</p></div>
          <div className="glass-card p-4"><p className="text-xs text-muted-foreground">Faturamento</p><p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p></div>
          <div className="glass-card p-4"><p className="text-xs text-muted-foreground">Custo</p><p className="text-2xl font-bold text-destructive">{formatCurrency(totalCost)}</p></div>
          <div className="glass-card p-4"><p className="text-xs text-muted-foreground">Lucro</p><p className={`text-2xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(profit)}</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3">Vendas por Período</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(20,5%,50%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(20,5%,50%)" />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'hsl(20,10%,9%)', border: '1px solid hsl(20,8%,18%)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="total" fill="hsl(25,95%,53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-4">
            <h3 className="text-sm font-bold mb-3">Por Categoria</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'hsl(20,10%,9%)', border: '1px solid hsl(20,8%,18%)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card p-4">
          <h3 className="text-sm font-bold mb-3">Por Forma de Pagamento</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {paymentData.map((p) => (
              <div key={p.name} className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground capitalize">{p.name}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(p.value)}</p>
              </div>
            ))}
            {paymentData.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-4">Sem dados</p>}
          </div>
        </div>
      </div>
    </PinGuard>
  );
}
