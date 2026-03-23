import { useState, useMemo } from 'react';
import { PinGuard } from '@/components/PinGuard';
import { DateFilter, filterByDate } from '@/components/DateFilter';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { startOfDay, endOfDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Eye, XCircle, Printer } from 'lucide-react';
import { Sale } from '@/types/pizzaria';

export default function Vendas() {
  const { sales, cancelSale } = useStore();
  const { cnpj, companyName } = useAuthStore();
  const [dateRange, setDateRange] = useState({ start: startOfDay(new Date()), end: endOfDay(new Date()) });
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const filtered = useMemo(() => {
    let result = filterByDate(sales, dateRange.start, dateRange.end);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.code.includes(q) || s.customerName.toLowerCase().includes(q));
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, dateRange, search]);

  const handleCancel = (sale: Sale) => {
    if (!window.confirm(`Cancelar venda #${sale.code}?`)) return;
    cancelSale(sale.id);
    setSelectedSale(null);
    toast.success('Venda cancelada');
  };

  const getItemLabel = (item: Sale['items'][0]) => {
    let label = item.product.name;
    if (item.pizzaSize) label = `Pizza ${item.pizzaSize} ${label}`;
    if (item.secondFlavor) label += ` / ${item.secondFlavor.name}`;
    return label;
  };

  const printReceipt = () => {
    const el = document.getElementById('receipt-content');
    if (!el) return;
    const w = window.open('', '', 'width=320,height=600');
    if (!w) return;
    w.document.write(`<html><head><style>body{font-family:monospace;font-size:12px;width:80mm;margin:0 auto;padding:10px;}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.print();
    w.close();
  };

  return (
    <PinGuard title="Vendas">
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">🧾 Vendas</h1>
          <DateFilter onFilter={(s, e) => setDateRange({ start: s, end: e })} />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código ou cliente..." className="pl-9 bg-secondary border-border" />
        </div>

        <div className="space-y-2">
          {filtered.map(sale => (
            <div key={sale.id} className={`glass-card p-3 flex items-center gap-4 ${sale.cancelled ? 'opacity-50' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold">#{sale.code}</span>
                  {sale.cancelled && <span className="text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded">CANCELADA</span>}
                </div>
                <p className="text-xs text-muted-foreground">{sale.customerName} · {formatDateTime(sale.date)}</p>
              </div>
              <span className="font-bold text-primary">{formatCurrency(sale.total)}</span>
              <div className="flex gap-1">
                <button onClick={() => setSelectedSale(sale)} className="p-1.5 rounded bg-secondary hover:bg-accent transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                {!sale.cancelled && (
                  <button onClick={() => handleCancel(sale)} className="p-1.5 rounded bg-secondary hover:bg-destructive/20 text-destructive transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                )}
                <button onClick={() => { setSelectedSale(sale); setShowReceipt(true); }} className="p-1.5 rounded bg-secondary hover:bg-accent transition-colors"><Printer className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma venda encontrada</p>}
        </div>

        {/* Sale detail dialog */}
        <Dialog open={!!selectedSale && !showReceipt} onOpenChange={() => setSelectedSale(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader><DialogTitle>Venda #{selectedSale?.code}</DialogTitle></DialogHeader>
            {selectedSale && (
              <div className="space-y-3">
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Cliente:</span> {selectedSale.customerName}</p>
                  <p><span className="text-muted-foreground">Contato:</span> {selectedSale.customerContact || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Data:</span> {formatDateTime(selectedSale.date)}</p>
                  {selectedSale.cancelled && <p className="text-destructive font-bold">CANCELADA em {formatDateTime(selectedSale.cancelledAt!)}</p>}
                </div>
                <div className="space-y-1">
                  {selectedSale.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-secondary rounded px-2 py-1">
                      <span>{item.quantity}x {getItemLabel(item)}</span>
                      <span className="font-bold">{formatCurrency(item.calculatedPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">{formatCurrency(selectedSale.total)}</span></div>
                  <div className="mt-1 space-y-0.5">
                    {selectedSale.payments.map((p, i) => (
                      <div key={i} className="flex justify-between text-xs text-muted-foreground"><span className="capitalize">{p.method}</span><span>{formatCurrency(p.amount)}</span></div>
                    ))}
                    {selectedSale.change > 0 && <div className="flex justify-between text-xs text-warning"><span>Troco</span><span>{formatCurrency(selectedSale.change)}</span></div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowReceipt(true)} variant="outline" className="flex-1 gap-1"><Printer className="w-3.5 h-3.5" /> Nota</Button>
                  {!selectedSale.cancelled && <Button onClick={() => handleCancel(selectedSale)} variant="outline" className="border-destructive text-destructive gap-1"><XCircle className="w-3.5 h-3.5" /> Cancelar</Button>}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Receipt dialog */}
        <Dialog open={showReceipt} onOpenChange={() => setShowReceipt(false)}>
          <DialogContent className="bg-card border-border max-w-xs">
            <DialogHeader><DialogTitle>Nota</DialogTitle></DialogHeader>
            {selectedSale && (
              <>
                <div id="receipt-content" className="font-mono text-xs leading-relaxed bg-foreground text-background p-4 rounded whitespace-pre-wrap">
{`================================
${companyName.toUpperCase().padStart(16 + companyName.length / 2).padEnd(32)}
  CNPJ: ${cnpj}
================================

PEDIDO Nº: ${selectedSale.code}
DATA: ${new Date(selectedSale.date).toLocaleDateString('pt-BR')}  ${new Date(selectedSale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}

--------------------------------
ITENS DO PEDIDO
--------------------------------
${selectedSale.items.map(i => `${i.quantity}x ${getItemLabel(i).padEnd(20).slice(0, 20)} ${formatCurrency(i.calculatedPrice * i.quantity)}`).join('\n')}

--------------------------------
${selectedSale.items.flatMap(i => i.observations || []).length > 0 ? `OBSERVAÇÕES:\n${selectedSale.items.flatMap(i => i.observations.map(o => `- ${o}`)).join('\n')}\n\n--------------------------------` : ''}
TOTAL DO PEDIDO: ${formatCurrency(selectedSale.total)}
--------------------------------

FORMA DE PAGAMENTO:
${selectedSale.payments.map(p => `${p.method.toUpperCase()} ${formatCurrency(p.amount)}`).join('\n')}
${selectedSale.change > 0 ? `TROCO: ${formatCurrency(selectedSale.change)}` : ''}

CLIENTE: ${selectedSale.customerName}

--------------------------------
      VOLTE SEMPRE!
================================`}
                </div>
                <Button onClick={printReceipt} className="w-full bg-primary hover:bg-primary/90 gap-1"><Printer className="w-4 h-4" /> Imprimir</Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PinGuard>
  );
}
