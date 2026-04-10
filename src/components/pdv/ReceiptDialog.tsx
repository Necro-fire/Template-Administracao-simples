import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sale, PAYMENT_METHODS } from '@/types/pizzaria';
import { formatCurrency } from '@/lib/format';
import { Printer, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

interface ReceiptDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LINE = '--------------------------------';
const PAD = 32; // thermal 58mm ≈ 32 chars

function rightAlign(left: string, right: string, width = PAD): string {
  const gap = width - left.length - right.length;
  return left + (gap > 0 ? ' '.repeat(gap) : ' ') + right;
}

export function ReceiptDialog({ sale, open, onOpenChange }: ReceiptDialogProps) {
  const { companyName } = useAuthStore();
  const [showPreview, setShowPreview] = useState(false);

  if (!sale) return null;

  const dateStr = new Date(sale.date).toLocaleDateString('pt-BR');
  const timeStr = new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const paymentLabel = sale.payments
    .map(p => PAYMENT_METHODS.find(m => m.method === p.method)?.label || p.method)
    .join(', ');
  const paymentTotal = formatCurrency(sale.total);

  const getItemLabel = (item: Sale['items'][0]) => {
    let label = item.product.name;
    if (item.pizzaSize) label = `Pizza ${item.pizzaSize} ${label}`;
    return label;
  };

  const buildReceipt = (): string => {
    const lines: string[] = [];
    const center = (text: string) => {
      const pad = Math.max(0, Math.floor((PAD - text.length) / 2));
      return ' '.repeat(pad) + text;
    };

    // 1. Header
    lines.push(center(`Pedido ${sale.code}`));
    if (sale.deliveryMode === 'entrega') {
      lines.push(center('Entrega'));
    } else {
      lines.push(center('Retirada'));
    }
    lines.push('');

    // 2. Loja
    lines.push(center('Loja'));
    lines.push(center(companyName || 'Minha Loja'));
    lines.push('');

    // 3. Cliente
    if (sale.customerName || sale.customerContact) {
      lines.push(center('Cliente'));
      if (sale.customerName) lines.push(`Nome: ${sale.customerName}`);
      if (sale.customerContact) lines.push(`Telefone: ${sale.customerContact}`);
      lines.push('');
    }

    // 4. Endereco de entrega
    if (sale.deliveryMode === 'entrega' && sale.deliveryAddress) {
      const addr = sale.deliveryAddress;
      lines.push(center('Endereco de entrega'));
      let addrLine = addr.street;
      if (addr.number) addrLine += `, ${addr.number}`;
      if (addr.neighborhood) addrLine += ` - ${addr.neighborhood}`;
      lines.push(addrLine);

      let line2Parts: string[] = [];
      if (addr.cep) line2Parts.push(`CEP ${addr.cep}`);
      if (line2Parts.length > 0) lines.push(line2Parts.join(' - '));

      if (addr.complement) lines.push(addr.complement);
      if (addr.reference) lines.push(addr.reference);
      lines.push('');
    }

    // 5. Itens do pedido
    lines.push(center('Itens do pedido'));
    lines.push(`Data: ${dateStr}`);
    lines.push(`Hora: ${timeStr}`);
    lines.push(LINE);
    lines.push(rightAlign('Qtd  Itens', 'Preco'));

    sale.items.forEach(item => {
      const mainLabel = getItemLabel(item);
      const secondLabel = item.secondFlavor ? item.secondFlavor.name : '';
      const price = formatCurrency(item.calculatedPrice * item.quantity);
      const qtyStr = String(item.quantity);

      // First line: qty + name + price
      const leftPart = `${qtyStr}    ${mainLabel}`;
      lines.push(rightAlign(leftPart, price));

      // Second flavor on next line (indented)
      if (secondLabel) {
        lines.push(`     ${secondLabel}`);
      }

      // Border info
      if (item.border) {
        const borderPrice = item.borderFree ? 'Gratis' : formatCurrency(item.border.price);
        lines.push(`     Borda ${item.border.name}: ${borderPrice}`);
      }

      // Observations
      item.observations.forEach(obs => {
        lines.push(`     ${obs}`);
      });

      lines.push('');
    });

    // 6. Totals
    lines.push(LINE);
    const subtotal = sale.total - (sale.deliveryFee || 0);
    lines.push(rightAlign('Itens do pedido', formatCurrency(subtotal)));
    if (sale.deliveryFee && sale.deliveryFee > 0) {
      lines.push(rightAlign('Taxa de entrega', formatCurrency(sale.deliveryFee)));
    }
    lines.push(rightAlign('Subtotal', paymentTotal));
    lines.push(LINE);

    // 7. Forma de pagamento
    lines.push('');
    lines.push('Forma de pagamento');
    sale.payments.forEach(p => {
      const label = PAYMENT_METHODS.find(m => m.method === p.method)?.label || p.method;
      lines.push(rightAlign(label, formatCurrency(p.amount)));
    });
    if (sale.change > 0) {
      lines.push(rightAlign('Troco', formatCurrency(sale.change)));
    }
    lines.push(LINE);

    // 8. Observacoes
    if (sale.observations && sale.observations.length > 0) {
      lines.push('');
      lines.push('Observacao');
      sale.observations.forEach(o => lines.push(o));
    }

    return lines.join('\n');
  };

  const printReceipt = () => {
    const content = buildReceipt();
    const w = window.open('', '', 'width=320,height=600');
    if (!w) return;
    w.document.write(
      `<html><head><style>body{font-family:monospace;font-size:12px;width:80mm;margin:0 auto;padding:10px;white-space:pre-wrap;}</style></head><body>${content}</body></html>`
    );
    w.document.close();
    w.print();
    w.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Imprimir nota do pedido #{sale.code}?</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Button onClick={printReceipt} className="flex-1 gap-2">
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? 'Ocultar' : 'Visualizar'}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {showPreview && (
          <div className="font-mono text-[11px] leading-relaxed bg-secondary border border-border text-foreground p-4 rounded-lg whitespace-pre-wrap max-h-[45vh] overflow-y-auto animate-fade-in">
            {buildReceipt()}
          </div>
        )}

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          Nao imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
