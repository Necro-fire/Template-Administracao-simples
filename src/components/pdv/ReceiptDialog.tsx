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
const LINE_WIDTH = 32; // characters that fit in 55mm at 9px mono
const SEP_LINE = '-'.repeat(LINE_WIDTH);

function padRow(left: string, right: string): string {
  const gap = LINE_WIDTH - left.length - right.length;
  if (gap < 1) return left + ' ' + right;
  return left + ' '.repeat(gap) + right;
}

function centerText(text: string): string {
  const pad = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
  return ' '.repeat(pad) + text;
}

function wrapText(text: string, maxWidth: number): string[] {
  if (text.length <= maxWidth) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxWidth) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function ReceiptDialog({ sale, open, onOpenChange }: ReceiptDialogProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!sale) return null;

  const dateStr = new Date(sale.date).toLocaleDateString('pt-BR');
  const timeStr = new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const getItemLabel = (item: Sale['items'][0]) => {
    let label = item.product.name;
    if (item.pizzaSize) label = `Pizza ${item.pizzaSize} ${label}`;
    return label;
  };

  const buildReceiptLines = (): string[] => {
    const out: string[] = [];

    // Header
    out.push(centerText(COMPANY_NAME));
    out.push(centerText(`CNPJ: ${COMPANY_CNPJ}`));
    out.push(SEP_LINE);
    out.push('');

    // Order
    out.push(centerText(`PEDIDO #${sale.code}`));
    out.push(centerText(sale.deliveryMode === 'entrega' ? 'ENTREGA' : 'RETIRADA'));
    out.push(centerText(`${dateStr} - ${timeStr}`));
    out.push(SEP_LINE);

    // Customer
    const custName = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.name || sale.customerName)
      : sale.customerName;
    const custPhone = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.phone || sale.customerContact)
      : sale.customerContact;

    if (custName || custPhone) {
      out.push('');
      out.push(centerText('CLIENTE'));
      if (custName) out.push(`Nome: ${custName}`);
      if (custPhone) out.push(`Tel: ${custPhone}`);
      out.push(SEP_LINE);
    }

    // Address
    if (sale.deliveryMode === 'entrega' && sale.deliveryAddress) {
      const addr = sale.deliveryAddress;
      out.push('');
      out.push(centerText('ENDERECO DE ENTREGA'));
      let addrLine = addr.street;
      if (addr.number) addrLine += `, ${addr.number}`;
      if (addr.neighborhood) addrLine += ` - ${addr.neighborhood}`;
      wrapText(addrLine, LINE_WIDTH).forEach(l => out.push(l));
      if (addr.cep) out.push(`CEP: ${addr.cep}`);
      if (addr.complement) wrapText(addr.complement, LINE_WIDTH).forEach(l => out.push(l));
      if (addr.reference) wrapText(addr.reference, LINE_WIDTH).forEach(l => out.push(l));
      out.push(SEP_LINE);
    }

    // Items
    out.push('');
    out.push(centerText('ITENS DO PEDIDO'));
    out.push(SEP_LINE);

    sale.items.forEach(item => {
      const label = getItemLabel(item);
      const totalItem = item.calculatedPrice * item.quantity;
      const priceStr = formatCurrency(totalItem);
      const qtyStr = `${item.quantity}x `;
      const maxItemWidth = LINE_WIDTH - qtyStr.length - priceStr.length - 1;

      if (label.length <= maxItemWidth) {
        out.push(padRow(qtyStr + label, priceStr));
      } else {
        const wrapped = wrapText(label, maxItemWidth);
        out.push(padRow(qtyStr + wrapped[0], priceStr));
        for (let i = 1; i < wrapped.length; i++) {
          out.push('   ' + wrapped[i]);
        }
      }

      if (item.secondFlavor) {
        out.push(`   / ${item.secondFlavor.name}`);
      }
      if (item.border) {
        const bPrice = item.borderFree ? 'Gratis' : formatCurrency(item.border.price);
        out.push(`   Borda: ${item.border.name} (${bPrice})`);
      }
      item.observations.forEach(obs => {
        out.push(`   * ${obs}`);
      });
    });

    out.push(SEP_LINE);

    // Totals
    const subtotal = sale.total - (sale.deliveryFee || 0);
    out.push(padRow('Itens do pedido', formatCurrency(subtotal)));
    if (sale.deliveryFee && sale.deliveryFee > 0) {
      out.push(padRow('Taxa de entrega', formatCurrency(sale.deliveryFee)));
    }
    out.push(padRow('TOTAL', formatCurrency(sale.total)));
    out.push(SEP_LINE);

    // Payment
    out.push('');
    out.push(centerText('FORMA DE PAGAMENTO'));
    sale.payments.forEach(p => {
      const label = PAYMENT_METHODS.find(m => m.method === p.method)?.label || p.method;
      out.push(padRow(label, formatCurrency(p.amount)));
    });
    if (sale.change > 0) {
      out.push(padRow('Troco', formatCurrency(sale.change)));
    }
    out.push(SEP_LINE);

    // Observations
    if (sale.observations && sale.observations.length > 0) {
      out.push('');
      out.push(centerText('OBSERVACOES'));
      sale.observations.forEach(o => {
        wrapText(o, LINE_WIDTH).forEach(l => out.push(l));
      });
      out.push(SEP_LINE);
    }

    // Footer
    out.push('');
    out.push(centerText('Obrigado pela'));
    out.push(centerText('preferencia!'));
    out.push(centerText('Volte sempre.'));
    out.push('');

    return out;
  };

  const buildReceiptHTML = (lines: string[]): string => {
    return lines.map(line => {
      if (line === SEP_LINE) return `<div class="sep-line">${SEP_LINE}</div>`;
      if (line === '') return '<div class="blank">&nbsp;</div>';

      // Bold for section titles
      const trimmed = line.trim();
      const isBold = [
        COMPANY_NAME, `CNPJ: ${COMPANY_CNPJ}`,
        'CLIENTE', 'ENDERECO DE ENTREGA', 'ITENS DO PEDIDO',
        'FORMA DE PAGAMENTO', 'OBSERVACOES', 'TOTAL',
        'Obrigado pela', 'preferencia!', 'Volte sempre.'
      ].some(t => trimmed === t) || trimmed.startsWith('PEDIDO #');

      const isTotalLine = trimmed.startsWith('TOTAL');

      let cls = 'line';
      if (isBold) cls += ' bold';
      if (isTotalLine) cls += ' total-line';

      return `<div class="${cls}">${line.replace(/ /g, '&nbsp;')}</div>`;
    }).join('\n');
  };

  const receiptLines = buildReceiptLines();
  const receiptHTML = buildReceiptHTML(receiptLines);

  const sharedCSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .receipt {
      font-family: 'Courier New', Consolas, 'Lucida Console', monospace;
      font-size: 12px;
      line-height: 1.4;
      width: 55mm;
      margin: 0 auto;
      padding: 4mm 2mm;
      color: #000;
      background: #fff;
      white-space: pre;
      word-break: break-all;
      overflow-wrap: break-word;
    }
    .receipt .line,
    .receipt .sep-line,
    .receipt .blank {
      white-space: pre;
      font-family: 'Courier New', Consolas, 'Lucida Console', monospace;
      font-size: 12px;
      line-height: 1.4;
    }
    .receipt .bold {
      font-weight: bold;
    }
    .receipt .total-line {
      font-size: 13px;
      font-weight: bold;
    }
    .receipt .sep-line {
      color: #000;
    }
    .receipt .blank {
      height: 6px;
    }
  `;

  const printCSS = `
    ${sharedCSS}
    @page {
      size: 55mm auto;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
    }
  `;

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
            <style dangerouslySetInnerHTML={{ __html: sharedCSS }} />
            <div className="receipt" dangerouslySetInnerHTML={{ __html: receiptHTML }} />
          </div>
        )}

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          Nao imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
