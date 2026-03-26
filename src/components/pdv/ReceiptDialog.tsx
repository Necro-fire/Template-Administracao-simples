import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sale, PAYMENT_METHODS } from '@/types/pizzaria';
import { formatCurrency } from '@/lib/format';
import { Printer, Truck, User, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type ReceiptType = 'entregador' | 'cliente' | 'completa';

interface ReceiptDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDialog({ sale, open, onOpenChange }: ReceiptDialogProps) {
  const [receiptType, setReceiptType] = useState<ReceiptType>('cliente');
  const { companyName, cnpj } = useAuthStore();

  if (!sale) return null;

  const getItemLabel = (item: Sale['items'][0]) => {
    let label = item.product.name;
    if (item.pizzaSize) label = `Pizza ${item.pizzaSize} ${label}`;
    if (item.secondFlavor) label += ` / ${item.secondFlavor.name}`;
    return label;
  };

  const dateStr = new Date(sale.date).toLocaleDateString('pt-BR');
  const timeStr = new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const paymentLabel = sale.payments.map(p => PAYMENT_METHODS.find(m => m.method === p.method)?.label || p.method).join(', ');
  const internalCost = sale.items.reduce((sum, item) => {
    const productCost = (Number(item.product.cost) || 0) * item.quantity;
    const borderCost = item.border ? Number(item.border.cost || 0) : 0;
    const freeSodaCost = item.freeSoda ? Number(item.freeSoda.cost || 0) : 0;
    return sum + productCost + borderCost + freeSodaCost;
  }, 0);
  const discountValue = sale.items.reduce((sum, item) => {
    const freeBorder = item.borderFree && item.border ? Number(item.border.price || 0) : 0;
    const freeSoda = item.freeSoda ? Number(item.freeSoda.price || 0) : 0;
    return sum + freeBorder + freeSoda;
  }, 0);

  const renderEntregador = () => {
    const lines: string[] = [
      companyName.toUpperCase(),
      `CNPJ: ${cnpj}`,
      '',
      'NOTA DO ENTREGADOR',
      `Pedido: ${sale.code}`,
      `Data: ${dateStr} | ${timeStr}`,
      '',
    ];
    if (sale.deliveryMode === 'entrega' && sale.deliveryAddress) {
      const addr = sale.deliveryAddress;
      lines.push('ENDEREÇO DE ENTREGA:');
      lines.push(`${addr.street}, nº ${addr.number}`);
      lines.push(`Bairro ${addr.neighborhood}`);
      lines.push(`CEP: ${addr.cep}`);
      if (addr.reference) lines.push(`Referência: ${addr.reference}`);
      if (addr.phone) lines.push(`Telefone: ${addr.phone}`);
      lines.push('');
    }
    lines.push('ITENS (RESUMO):');
    sale.items.forEach(item => {
      lines.push(`${getItemLabel(item)}${item.quantity > 1 ? ` x${item.quantity}` : ''}`);
    });
    lines.push('');
    lines.push(`TOTAL A RECEBER: ${formatCurrency(sale.total)}`);
    if (sale.deliveryMode === 'entrega' && sale.deliveryAddress?.reference) {
      lines.push(`Referência: ${sale.deliveryAddress.reference}`);
    }
    if (sale.observations.length > 0) {
      lines.push('');
      lines.push('OBSERVAÇÕES DE ENTREGA:');
      sale.observations.forEach(o => lines.push(o));
    }
    return lines.join('\n');
  };

  const renderCliente = () => {
    const lines: string[] = [
      companyName.toUpperCase(),
      `CNPJ: ${cnpj}`,
      'Obrigado pela preferência!',
      '',
      'NOTA DO CLIENTE',
      `Pedido: ${sale.code}`,
      `Data: ${dateStr} | ${timeStr}`,
      '',
      'Itens:',
    ];
    sale.items.forEach(item => {
      const price = item.calculatedPrice * item.quantity;
      lines.push(`${item.quantity}x ${getItemLabel(item)} .......... ${formatCurrency(price)}`);
      if (item.border) {
        const borderPrice = item.borderFree ? 'Grátis' : formatCurrency(item.border.price);
        lines.push(`  • Borda ${item.border.name}: ${borderPrice}`);
      }
      item.observations.forEach(obs => lines.push(`  • ${obs}`));
    });
    lines.push('');
    lines.push('--------------------------------------');
    const subtotal = sale.total - (sale.deliveryFee || 0);
    if (sale.deliveryFee && sale.deliveryFee > 0) {
      lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
      lines.push(`Taxa de Entrega: ${formatCurrency(sale.deliveryFee)}`);
    }
    lines.push(`TOTAL: ${formatCurrency(sale.total)}`);
    lines.push(`Forma de pagamento: ${paymentLabel}`);
    if (sale.change > 0) lines.push(`Troco: ${formatCurrency(sale.change)}`);
    lines.push('--------------------------------------');
    lines.push('Volte sempre!');
    return lines.join('\n');
  };

  const renderCompleta = () => {
    const lines: string[] = [
      `${companyName.toUpperCase()} LTDA`,
      `CNPJ: ${cnpj}`,
      '',
      'NOTA COMPLETA',
      `Pedido: ${sale.code}`,
      `Data: ${dateStr} | ${timeStr}`,
      '',
    ];
    if (sale.customerName || sale.customerContact) {
      lines.push('CLIENTE:');
      if (sale.customerName) lines.push(`Nome: ${sale.customerName}`);
      if (sale.customerContact) lines.push(`Telefone: ${sale.customerContact}`);
      lines.push('');
    }
    if (sale.deliveryMode === 'entrega' && sale.deliveryAddress) {
      const addr = sale.deliveryAddress;
      lines.push('ENTREGA:');
      lines.push(`${addr.street}, nº ${addr.number} – ${addr.neighborhood}`);
      lines.push(`CEP: ${addr.cep}`);
      if (addr.complement) lines.push(`Complemento: ${addr.complement}`);
      if (addr.reference) lines.push(`Referência: ${addr.reference}`);
      lines.push('');
    }
    lines.push('ITENS:');
    sale.items.forEach(item => {
      const price = item.calculatedPrice * item.quantity;
      lines.push(`${getItemLabel(item)} .............. ${formatCurrency(price)}`);
      if (item.border) {
        const borderPrice = item.borderFree ? 'Grátis' : formatCurrency(item.border.price);
        lines.push(`  • Borda ${item.border.name}: ${borderPrice}`);
      }
      item.observations.forEach(obs => lines.push(`  • ${obs}`));
    });
    lines.push('');
    lines.push('RESUMO FINANCEIRO:');
    const subtotal = sale.total - (sale.deliveryFee || 0);
    lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
    lines.push(`Descontos/Benefícios: ${formatCurrency(discountValue)}`);
    if (sale.deliveryFee && sale.deliveryFee > 0) {
      lines.push(`Taxa de Entrega: ${formatCurrency(sale.deliveryFee)}`);
    }
    lines.push(`TOTAL FINAL: ${formatCurrency(sale.total)}`);
    lines.push(`Custos internos: ${formatCurrency(internalCost)}`);
    lines.push(`Resultado bruto: ${formatCurrency(sale.total - internalCost)}`);
    lines.push(`Forma de pagamento: ${paymentLabel}`);
    if (sale.change > 0) lines.push(`Troco: ${formatCurrency(sale.change)}`);
    lines.push('');
    lines.push('Obrigado pela preferência!');
    return lines.join('\n');
  };

  const getContent = () => {
    switch (receiptType) {
      case 'entregador': return renderEntregador();
      case 'cliente': return renderCliente();
      case 'completa': return renderCompleta();
    }
  };

  const printReceipt = () => {
    const content = getContent();
    const w = window.open('', '', 'width=320,height=600');
    if (!w) return;
    w.document.write(`<html><head><style>body{font-family:monospace;font-size:12px;width:80mm;margin:0 auto;padding:10px;white-space:pre-wrap;}</style></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
    w.close();
  };

  const tabs: { value: ReceiptType; label: string; icon: React.ReactNode }[] = [
    { value: 'entregador', label: 'Entregador', icon: <Truck className="w-3.5 h-3.5" /> },
    { value: 'cliente', label: 'Cliente', icon: <User className="w-3.5 h-3.5" /> },
    { value: 'completa', label: 'Completa', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Notas do Pedido #{sale.code}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-3">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setReceiptType(tab.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                receiptType === tab.value
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="font-mono text-[11px] leading-relaxed bg-secondary border border-border text-foreground p-4 rounded-lg whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
          {getContent()}
        </div>

        <Button onClick={printReceipt} className="w-full bg-primary hover:bg-primary/90 gap-1.5 font-semibold">
          <Printer className="w-4 h-4" /> Imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
