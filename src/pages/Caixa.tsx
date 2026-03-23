import { useState, useMemo } from 'react';
import { PinGuard } from '@/components/PinGuard';
import { DateFilter } from '@/components/DateFilter';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { startOfDay, endOfDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DollarSign, ArrowDownCircle, ArrowUpCircle, Clock, TrendingUp, Wallet, History } from 'lucide-react';

export default function Caixa() {
  const { cashRegister, cashHistory, openRegister, closeRegister, addMovement, deleteMovement } = useStore();
  const [initialAmount, setInitialAmount] = useState('');
  const [movType, setMovType] = useState<'reforco' | 'sangria'>('reforco');
  const [movAmount, setMovAmount] = useState('');
  const [movDesc, setMovDesc] = useState('');
  const [dateRange, setDateRange] = useState({ start: startOfDay(new Date()), end: endOfDay(new Date()) });

  const isOpen = cashRegister && !cashRegister.closedAt;

  const filteredHistory = useMemo(() =>
    cashHistory.filter(r => { const d = new Date(r.openedAt); return d >= dateRange.start && d <= dateRange.end; }),
    [cashHistory, dateRange]
  );

  const handleOpen = () => {
    const a = parseFloat(initialAmount);
    if (isNaN(a) || a < 0) { toast.error('Valor inválido'); return; }
    openRegister(a); setInitialAmount(''); toast.success('Caixa aberto!');
  };
  const handleClose = () => {
    if (!window.confirm('Fechar o caixa?')) return;
    closeRegister(); toast.success('Caixa fechado!');
  };
  const handleMovement = () => {
    const a = parseFloat(movAmount);
    if (isNaN(a) || a <= 0) { toast.error('Valor inválido'); return; }
    addMovement({ type: movType, amount: a, description: movDesc || movType, origin: 'manual' });
    setMovAmount(''); setMovDesc(''); toast.success('Registrado');
  };

  const salesTotal = cashRegister ? cashRegister.sales.filter(s => !s.cancelled).reduce((s, sale) => s + sale.total, 0) : 0;
  const entriesTotal = cashRegister ? cashRegister.entries.reduce((s, e) => s + e.amount, 0) : 0;
  const exitsTotal = cashRegister ? cashRegister.exits.reduce((s, e) => s + e.amount, 0) : 0;
  const currentBalance = cashRegister ? cashRegister.initialAmount + salesTotal + entriesTotal - exitsTotal : 0;

  return (
    <PinGuard title="Caixa">
      <div className="p-4 space-y-5 animate-fade-in max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Caixa</h1>
            <p className="text-sm text-muted-foreground">Controle financeiro do dia</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`status-badge ${isOpen ? 'status-open' : 'status-closed'}`}>
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
              {isOpen ? 'Aberto' : 'Fechado'}
            </div>
            {!isOpen ? (
              <div className="flex items-center gap-2">
                <Input type="number" step="0.01" value={initialAmount} onChange={e => setInitialAmount(e.target.value)}
                  placeholder="Valor inicial (R$)" className="bg-secondary border-border w-44 h-10 text-sm" />
                <Button onClick={handleOpen} className="bg-success hover:bg-success/90 text-success-foreground font-bold h-10">
                  Abrir Caixa
                </Button>
              </div>
            ) : (
              <Button onClick={handleClose} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 h-10">
                Fechar Caixa
              </Button>
            )}
          </div>
        </div>

        {isOpen && cashRegister && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="kpi-card kpi-info">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Saldo Inicial</p>
                  <Wallet className="w-4 h-4 text-info" />
                </div>
                <p className="text-2xl font-extrabold">{formatCurrency(cashRegister.initialAmount)}</p>
              </div>
              <div className="kpi-card kpi-success">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Vendas</p>
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <p className="text-2xl font-extrabold text-success">{formatCurrency(salesTotal)}</p>
                <p className="text-[11px] text-muted-foreground">{cashRegister.sales.filter(s => !s.cancelled).length} venda(s)</p>
              </div>
              <div className="kpi-card kpi-success">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Entradas</p>
                  <ArrowDownCircle className="w-4 h-4 text-success" />
                </div>
                <p className="text-2xl font-extrabold text-success">{formatCurrency(entriesTotal)}</p>
              </div>
              <div className="kpi-card kpi-destructive">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Saídas</p>
                  <ArrowUpCircle className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-2xl font-extrabold text-destructive">{formatCurrency(exitsTotal)}</p>
              </div>
              <div className="kpi-card kpi-primary">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Saldo Atual</p>
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <p className={`text-2xl font-extrabold ${currentBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(currentBalance)}
                </p>
              </div>
            </div>

            {/* Movement + Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* New Movement */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Nova Movimentação
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button onClick={() => setMovType('reforco')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${movType === 'reforco' ? 'bg-success text-success-foreground shadow-md' : 'bg-secondary text-muted-foreground'}`}>
                      ↓ Reforço
                    </button>
                    <button onClick={() => setMovType('sangria')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${movType === 'sangria' ? 'bg-destructive text-destructive-foreground shadow-md' : 'bg-secondary text-muted-foreground'}`}>
                      ↑ Sangria
                    </button>
                  </div>
                  <Input type="number" step="0.01" value={movAmount} onChange={e => setMovAmount(e.target.value)}
                    placeholder="Valor (R$)" className="bg-secondary border-border h-10 text-sm" />
                  <Input value={movDesc} onChange={e => setMovDesc(e.target.value)}
                    placeholder="Descrição (opcional)" className="bg-secondary border-border h-10 text-sm" />
                  <Button onClick={handleMovement} className="w-full bg-primary hover:bg-primary/90 h-10 font-bold">
                    Registrar
                  </Button>
                </div>

                {/* Movement list */}
                {(cashRegister.entries.length > 0 || cashRegister.exits.length > 0) && (
                  <div className="mt-4 space-y-1.5 max-h-36 overflow-y-auto">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Movimentações do dia</p>
                    {[...cashRegister.entries.map(e => ({ ...e, _type: 'entry' as const })), ...cashRegister.exits.map(e => ({ ...e, _type: 'exit' as const }))]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(m => (
                        <div key={m.id} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2 text-sm group">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${m._type === 'entry' ? 'text-success' : 'text-destructive'}`}>
                              {m._type === 'entry' ? '↓' : '↑'}
                            </span>
                            <span className="text-xs">{m.description}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-xs ${m._type === 'entry' ? 'text-success' : 'text-destructive'}`}>
                              {m._type === 'entry' ? '+' : '-'}{formatCurrency(m.amount)}
                            </span>
                            <button onClick={() => { deleteMovement(m.id); toast.success('Removida'); }}
                              className="opacity-0 group-hover:opacity-100 text-destructive text-xs transition-opacity">✕</button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Sales list */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-success" />
                  Vendas do Caixa ({cashRegister.sales.filter(s => !s.cancelled).length})
                </h3>
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {cashRegister.sales.map(s => (
                    <div key={s.id} className={`flex items-center justify-between bg-secondary rounded-lg px-3 py-2.5 text-sm transition-opacity ${s.cancelled ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">#{s.code}</span>
                        <div>
                          <p className="text-xs font-medium">{s.customerName}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(s.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-sm ${s.cancelled ? 'text-destructive line-through' : 'text-success'}`}>
                          {formatCurrency(s.total)}
                        </span>
                        {s.cancelled && <p className="text-[10px] text-destructive">Cancelada</p>}
                      </div>
                    </div>
                  ))}
                  {cashRegister.sales.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda ainda</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* History */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-info" /> Histórico de Caixas
            </h3>
            <DateFilter onFilter={(s, e) => setDateRange({ start: s, end: e })} />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredHistory.map(r => {
              const rSales = r.sales.filter(s => !s.cancelled).reduce((s, sale) => s + sale.total, 0);
              const rEntries = r.entries.reduce((s, e) => s + e.amount, 0);
              const rExits = r.exits.reduce((s, e) => s + e.amount, 0);
              const rTotal = r.initialAmount + rSales + rEntries - rExits;
              return (
                <div key={r.id} className="bg-secondary rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{formatDateTime(r.openedAt)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.sales.length} vendas · Inicial: {formatCurrency(r.initialAmount)} · Entradas: {formatCurrency(rEntries)} · Saídas: {formatCurrency(rExits)}
                      </p>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${rTotal >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(rTotal)}</p>
                </div>
              );
            })}
            {filteredHistory.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro</p>}
          </div>
        </div>
      </div>
    </PinGuard>
  );
}

function ShoppingCart(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
    </svg>
  );
}
