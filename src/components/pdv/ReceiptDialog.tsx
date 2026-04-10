import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sale, PAYMENT_METHODS } from '@/types/pizzaria';
import { formatCurrency } from '@/lib/format';
import { Printer, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface ReceiptDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMPANY_NAME = 'Bella Pizza';
const COMPANY_CNPJ = '61.157280/0001-30';
const COL_WIDTH = 42; // chars for 55mm at ~12px monospace

function pad(left: string, right: string, width = COL_WIDTH): string {
  const gap = width - left.length - right.length;
  return left + (gap > 0 ? ' '.repeat(gap) : ' ') + right;
}

function center(text: string, width = COL_WIDTH): string {
  const p = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(p) + text;
}

function wrap(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= max) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

const SEP = '─'.repeat(COL_WIDTH);

export function ReceiptDialog({ sale, open, onOpenChange }: ReceiptDialogProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!sale) return null;

  const dateStr = new Date(sale.date).toLocaleDateString('pt-BR');
  const timeStr = new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const buildHTML = (): string => {
    const h = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const line = (t: string, cls = '') => `<div class="${cls}">${h(t).replace(/ /g, '&nbsp;')}</div>`;
    const sep = () => `<div class="sep">${SEP}</div>`;
    const blank = () => '<div class="blank">&nbsp;</div>';
    const bold = (t: string) => line(t, 'bold');
    const boldCenter = (t: string) => line(center(t), 'bold');

    const parts: string[] = [];

    // Header
    parts.push(`<div class="company">${h(center(COMPANY_NAME))}</div>`);
    parts.push(line(center(`CNPJ: ${COMPANY_CNPJ}`)));
    parts.push(sep());

    // Order
    parts.push(blank());
    parts.push(boldCenter(`PEDIDO #${sale.code}`));
    parts.push(line(center(sale.deliveryMode === 'entrega' ? 'ENTREGA' : 'RETIRADA')));
    parts.push(line(center(`${dateStr} — ${timeStr}`)));
    parts.push(blank());
    parts.push(sep());

    // Customer
    const custName = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.name || sale.customerName)
      : sale.customerName;
    const custPhone = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.phone || sale.customerContact)
      : sale.customerContact;

    if (custName || custPhone) {
      parts.push(blank());
      parts.push(boldCenter('CLIENTE'));
      parts.push(blank());
      if (custName) parts.push(line(`Nome: ${custName}`));
      if (custPhone) parts.push(line(`Telefone: ${custPhone}`));
      parts.push(blank());
      parts.push(sep());
    }

    // Address
    if (sale.deliveryMode === 'entrega' && sale.deliveryAddress) {
      const addr = sale.deliveryAddress;
      parts.push(blank());
      parts.push(boldCenter('ENDEREÇO DE ENTREGA'));
      parts.push(blank());
      let addrLine = addr.street;
      if (addr.number) addrLine += `, ${addr.number}`;
      if (addr.neighborhood) addrLine += ` - ${addr.neighborhood}`;
      wrap(addrLine, COL_WIDTH).forEach(l => parts.push(line(l)));
      if (addr.cep) parts.push(line(`CEP: ${addr.cep}`));
      if (addr.complement) wrap(`Compl: ${addr.complement}`, COL_WIDTH).forEach(l => parts.push(line(l)));
      if (addr.reference) wrap(`Ref: ${addr.reference}`, COL_WIDTH).forEach(l => parts.push(line(l)));
      parts.push(blank());
      parts.push(sep());
    }

    // Items header
    parts.push(blank());
    parts.push(boldCenter('ITENS DO PEDIDO'));
    parts.push(blank());
    const colHeader = pad('Qtd  Item', 'Valor');
    parts.push(bold(colHeader));

    // Items
    sale.items.forEach(item => {
      let label = item.product.name;
      if (item.pizzaSize) label = `Pizza ${item.pizzaSize} ${label}`;
      const totalItem = item.calculatedPrice * item.quantity;
      const priceStr = formatCurrency(totalItem);
      const qtyStr = `${item.quantity}    `;
      const maxW = COL_WIDTH - qtyStr.length - priceStr.length - 1;

      if (label.length <= maxW) {
        parts.push(line(pad(qtyStr + label, priceStr)));
      } else {
        const wrapped = wrap(label, maxW);
        parts.push(line(pad(qtyStr + wrapped[0], priceStr)));
        for (let i = 1; i < wrapped.length; i++) {
          parts.push(line('     ' + wrapped[i]));
        }
      }

      if (item.secondFlavor) {
        parts.push(line(`     / ${item.secondFlavor.name}`, 'sub'));
      }
      if (item.border) {
        const bPrice = item.borderFree ? 'Grátis' : formatCurrency(item.border.price);
        parts.push(line(`     Borda: ${item.border.name} (${bPrice})`, 'sub'));
      }
      if (item.freeSoda) {
        parts.push(line(`     * Refrigerante grátis - Pizza ${item.pizzaSize}`, 'sub'));
      }
      item.observations.forEach(obs => {
        parts.push(line(`     * ${obs}`, 'sub'));
      });
    });

    parts.push(blank());
    parts.push(sep());

    // Totals
    const subtotal = sale.total - (sale.deliveryFee || 0);
    parts.push(blank());
    parts.push(line(pad('Itens do pedido', formatCurrency(subtotal))));
    if (sale.deliveryFee && sale.deliveryFee > 0) {
      parts.push(line(pad('Taxa de entrega', formatCurrency(sale.deliveryFee))));
    }
    parts.push(bold(pad('TOTAL', formatCurrency(sale.total))));
    parts.push(blank());
    parts.push(sep());

    // Payment
    parts.push(blank());
    parts.push(boldCenter('FORMA DE PAGAMENTO'));
    parts.push(blank());
    sale.payments.forEach(p => {
      const label = PAYMENT_METHODS.find(m => m.method === p.method)?.label || p.method;
      parts.push(line(pad(label, formatCurrency(p.amount))));
    });
    if (sale.change > 0) {
      parts.push(line(pad('Troco', formatCurrency(sale.change))));
    }
    parts.push(blank());
    parts.push(sep());

    // Observations
    if (sale.observations && sale.observations.length > 0) {
      parts.push(blank());
      parts.push(boldCenter('OBSERVAÇÕES'));
      parts.push(blank());
      sale.observations.forEach(o => {
        wrap(o, COL_WIDTH).forEach(l => parts.push(line(l)));
      });
      parts.push(blank());
      parts.push(sep());
    }

    // Footer
    parts.push(blank());
    parts.push(boldCenter('Obrigado pela preferência! Volte sempre.'));
    parts.push(blank());

    return parts.join('\n');
  };

  const receiptCSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .receipt {
      font-family: Consolas, 'Courier New', 'Lucida Console', monospace;
      font-size: 12px;
      line-height: 1.5;
      width: 55mm;
      margin: 0 auto;
      padding: 3mm 2mm;
      color: #000;
      background: #fff;
      white-space: pre;
      word-break: break-all;
      overflow-wrap: break-word;
    }
    .receipt div {
      white-space: pre;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }
    .receipt .company {
      font-size: 16px;
      font-weight: bold;
      white-space: pre;
    }
    .receipt .bold { font-weight: bold; }
    .receipt .sub { color: #333; }
    .receipt .sep { color: #999; }
    .receipt .blank { height: 8px; }
  `;

  const printCSS = `
    ${receiptCSS}
    @page { size: 55mm auto; margin: 0; }
    body { margin: 0; padding: 0; }
  `;

  const receiptHTML = buildHTML();

  const printReceipt = () => {
    const w = window.open('', '', 'width=250,height=600');
    if (!w) return;
    w.document.write(`<html><head><meta charset="utf-8"><style>${printCSS}</style></head><body><div class="receipt">${receiptHTML}</div></body></html>`);
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
          <div className="bg-white text-black border border-border rounded-lg max-h-[50vh] overflow-y-auto animate-fade-in">
            <style dangerouslySetInnerHTML={{ __html: receiptCSS }} />
            <div className="receipt" dangerouslySetInnerHTML={{ __html: receiptHTML }} />
          </div>
        )}

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          Não imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
