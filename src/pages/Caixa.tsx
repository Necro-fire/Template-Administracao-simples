import { useState, useMemo } from 'react';
import { PinGuard } from '@/components/PinGuard';
import { DateFilter } from '@/components/DateFilter';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { startOfDay, endOfDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Caixa() {
  const { cashRegister, cashHistory, openRegister, closeRegister, addMovement } = useStore();
  const [initialAmount, setInitialAmount] = useState('');
  const [movType, setMovType] = useState<'reforco' | 'sangria'>('reforco');
  const [movAmount, setMovAmount] = useState('');
  const [movDesc, setMovDesc] = useState('');
  const [dateRange, setDateRange] = useState({ start: startOfDay(new Date()), end: endOfDay(new Date()) });

  const isOpen = cashRegister && !cashRegister.closedAt;

  const filteredHistory = useMemo(() => cashHistory.filter(r => { const d = new Date(r.openedAt); return d >= dateRange.start && d <= dateRange.end; }), [cashHistory, dateRange]);

  const handleOpen = () => { const a = parseFloat(initialAmount); if (isNaN(a) || a < 0) { toast.error('Valor inválido'); return; } openRegister(a); setInitialAmount(''); toast.success('Caixa aberto!'); };
  const handleClose = () => { if (!window.confirm('Fechar o caixa?')) return; closeRegister(); toast.success('Caixa fechado!'); };
  const handleMovement = () => { const a = parseFloat(movAmount); if (isNaN(a) || a <= 0) { toast.error('Valor inválido'); return; } addMovement({ type: movType, amount: a, description: movDesc || movType, origin: 'manual' }); setMovAmount(''); setMovDesc(''); toast.success('Registrado'); };

  const calcTotal = () => {
    if (!cashRegister) return 0;
    const salesTotal = cashRegister.sales.filter(s => !s.cancelled).reduce((s, sale) => s + sale.total, 0);
    const entries = cashRegister.entries.reduce((s, e) => s + e.amount, 0);
    const exits = cashRegister.exits.reduce((s, e) => s + e.amount, 0);
    return cashRegister.initialAmount + salesTotal + entries - exits;
  };

  return (
    <PinGuard title="Caixa">
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">💰 Caixa</h1>
          {!isOpen && (
            <div className="flex items-center gap-2">
              <Input type="number" step="0.01" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} placeholder="Valor inicial" className="bg-secondary border-border w-40 h-9 text-sm" />
              <Button onClick={handleOpen} className="bg-success hover:bg-success/90 text-success-foreground font-bold">Abrir Caixa</Button>
            </div>
          )}
          {isOpen && <Button onClick={handleClose} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">Fechar Caixa</Button>}
        </div>

        {isOpen && cashRegister && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="glass-card p-3"><p className="text-xs text-muted-foreground">Saldo Inicial</p><p className="text-lg font-bold">{formatCurrency(cashRegister.initialAmount)}</p></div>
              <div className="glass-card p-3"><p className="text-xs text-muted-foreground">Vendas</p><p className="text-lg font-bold text-success">{formatCurrency(cashRegister.sales.filter(s => !s.cancelled).reduce((s, sale) => s + sale.total, 0))}</p></div>
              <div className="glass-card p-3"><p className="text-xs text-muted-foreground">Movimentações</p><p className="text-lg font-bold text-info">{formatCurrency(cashRegister.entries.reduce((s, e) => s + e.amount, 0) - cashRegister.exits.reduce((s, e) => s + e.amount, 0))}</p></div>
              <div className="glass-card p-3"><p className="text-xs text-muted-foreground">Saldo Atual</p><p className="text-lg font-bold text-primary">{formatCurrency(calcTotal())}</p></div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold mb-3">Nova Movimentação</h3>
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex gap-1">
                  <button onClick={() => setMovType('reforco')} className={`px-3 py-1.5 rounded text-xs font-medium ${movType === 'reforco' ? 'bg-success text-success-foreground' : 'bg-secondary text-muted-foreground'}`}>Reforço</button>
                  <button onClick={() => setMovType('sangria')} className={`px-3 py-1.5 rounded text-xs font-medium ${movType === 'sangria' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-muted-foreground'}`}>Sangria</button>
                </div>
                <Input type="number" step="0.01" value={movAmount} onChange={e => setMovAmount(e.target.value)} placeholder="Valor" className="bg-secondary border-border h-9 text-sm w-32" />
                <Input value={movDesc} onChange={e => setMovDesc(e.target.value)} placeholder="Descrição" className="bg-secondary border-border h-9 text-sm flex-1" />
                <Button onClick={handleMovement} className="bg-primary hover:bg-primary/90 h-9">Registrar</Button>
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold mb-3">Vendas ({cashRegister.sales.length})</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {cashRegister.sales.map(s => (
                  <div key={s.id} className={`flex items-center justify-between bg-secondary rounded px-3 py-2 text-sm ${s.cancelled ? 'opacity-50 line-through' : ''}`}>
                    <span className="font-mono text-xs">#{s.code}</span>
                    <span className="text-xs text-muted-foreground">{s.customerName}</span>
                    <span className="font-bold text-primary">{formatCurrency(s.total)}</span>
                  </div>
                ))}
                {cashRegister.sales.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda</p>}
              </div>
            </div>
          </>
        )}

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold">Histórico</h3>
            <DateFilter onFilter={(s, e) => setDateRange({ start: s, end: e })} />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredHistory.map(r => (
              <div key={r.id} className="bg-secondary rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span className="text-xs text-muted-foreground">{formatDateTime(r.openedAt)}</span><span className="font-bold text-primary">{formatCurrency(r.initialAmount + r.sales.filter(s => !s.cancelled).reduce((s, sale) => s + sale.total, 0))}</span></div>
                <p className="text-xs text-muted-foreground mt-1">{r.sales.length} vendas · Inicial: {formatCurrency(r.initialAmount)}</p>
              </div>
            ))}
            {filteredHistory.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro</p>}
          </div>
        </div>
      </div>
    </PinGuard>
  );
}
