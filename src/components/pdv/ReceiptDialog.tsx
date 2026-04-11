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

const COMPANY_NAME = 'BELLA PIZZA';
const COMPANY_CNPJ = '61.157280/0001-30';

/** Remove all accents/diacritics from text */
function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Escape HTML */
function h(s: string): string {
  return stripAccents(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function ReceiptDialog({ sale, open, onOpenChange }: ReceiptDialogProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!sale) return null;

  const dateStr = new Date(sale.date).toLocaleDateString('pt-BR');
  const timeStr = new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const buildHTML = (): string => {
    const line = (t: string, cls = '') => `<div class="${cls}">${h(t)}</div>`;
    const center = (t: string, cls = '') => `<div class="ct ${cls}">${h(t)}</div>`;
    const bold = (t: string, cls = '') => center(t, `b ${cls}`);
    const sep = () => `<div class="sep">────────────────────────────</div>`;
    const row = (left: string, right: string) =>
      `<div class="row"><span>${h(left)}</span><span>${h(right)}</span></div>`;

    const p: string[] = [];

    // ── HEADER ──
    p.push(bold(COMPANY_NAME, 'company'));
    p.push(center(`CNPJ: ${COMPANY_CNPJ}`));
    p.push(center('CUPOM FISCAL'));
    p.push(sep());

    // ── ORDER ──
    p.push(bold(`PEDIDO #${sale.code}`));
    p.push(center(sale.deliveryMode === 'entrega' ? 'ENTREGA' : 'RETIRADA'));
    p.push(center(`${dateStr} - ${timeStr}`));
    p.push(sep());

    // ── CUSTOMER ──
    const custName = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.name || sale.customerName)
      : sale.customerName;
    const custPhone = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.phone || sale.customerContact)
      : sale.customerContact;

    if (custName || custPhone) {
      p.push(bold('CLIENTE'));
      if (custName) p.push(line(`Nome: ${custName}`));
      if (custPhone) p.push(line(`Tel: ${custPhone}`));
      p.push(sep());
    }

    // ── ADDRESS ──
    if (sale.deliveryMode === 'entrega' && sale.deliveryAddress) {
      const addr = sale.deliveryAddress;
      p.push(bold('ENDERECO DE ENTREGA'));
      let addrLine = addr.street;
      if (addr.number) addrLine += `, ${addr.number}`;
      if (addr.neighborhood) addrLine += ` - ${addr.neighborhood}`;
      p.push(line(addrLine));
      if (addr.cep) p.push(line(`CEP: ${addr.cep}`));
      if (addr.complement) p.push(line(`Compl: ${addr.complement}`));
      if (addr.reference) p.push(line(`Ref: ${addr.reference}`));
      p.push(sep());
    }

    // ── ITEMS ──
    p.push(bold('ITENS DO PEDIDO'));

    sale.items.forEach(item => {
      let label = item.product.name;
      if (item.pizzaSize) label = `Pizza ${item.pizzaSize} ${label}`;
      const totalItem = item.calculatedPrice * item.quantity;
      p.push(row(`${item.quantity}x ${label}`, formatCurrency(totalItem)));

      if (item.secondFlavor) {
        p.push(line(`  / ${item.secondFlavor.name}`, 'sub'));
      }
      if (item.border) {
        const bPrice = item.borderFree ? 'Gratis' : formatCurrency(item.border.price);
        p.push(line(`  Borda: ${item.border.name} (${bPrice})`, 'sub'));
      }
      if (item.freeSoda) {
        p.push(line(`  * Refri gratis`, 'sub'));
      }
      item.observations.forEach(obs => {
        p.push(line(`  * ${obs}`, 'sub'));
      });
    });

    p.push(sep());

    // ── TOTALS ──
    const subtotal = sale.total - (sale.deliveryFee || 0);
    p.push(row('Subtotal', formatCurrency(subtotal)));
    if (sale.deliveryFee && sale.deliveryFee > 0) {
      p.push(row('Taxa entrega', formatCurrency(sale.deliveryFee)));
    }
    p.push(`<div class="row b"><span>${h('TOTAL')}</span><span>${h(formatCurrency(sale.total))}</span></div>`);
    p.push(sep());

    // ── PAYMENT ──
    p.push(bold('PAGAMENTO'));
    sale.payments.forEach(pm => {
      const label = PAYMENT_METHODS.find(m => m.method === pm.method)?.label || pm.method;
      p.push(row(label, formatCurrency(pm.amount)));
    });
    if (sale.change > 0) {
      p.push(row('Troco', formatCurrency(sale.change)));
    }

    // ── OBSERVATIONS ──
    if (sale.observations && sale.observations.length > 0) {
      p.push(sep());
      p.push(bold('OBSERVACOES'));
      sale.observations.forEach(o => p.push(line(o)));
    }

    // ── FOOTER (always last) ──
    p.push(sep());
    p.push(bold('Obrigado pela preferencia!'));
    p.push(center('Volte sempre.'));

    return p.join('\n');
  };

  const receiptCSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .receipt {
      font-family: Consolas, 'Courier New', 'Lucida Console', monospace;
      font-size: 13px;
      line-height: 1.2;
      width: 55mm;
      margin: 0 auto;
      padding: 1mm 2mm;
      color: #000;
      background: #fff;
      text-align: center;
    }
    .receipt div {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }
    .receipt .ct { text-align: center; }
    .receipt .company { font-size: 16px; font-weight: bold; }
    .receipt .b { font-weight: bold; }
    .receipt .sub { color: #333; font-size: 12px; text-align: left; }
    .receipt .sep { color: #aaa; }
    .receipt .row {
      display: flex;
      justify-content: space-between;
      text-align: left;
    }
    .receipt .row span:last-child { text-align: right; white-space: nowrap; }
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
          <DialogTitle className="text-foreground">
            {stripAccents(`Imprimir nota do pedido #${sale.code}?`)}
          </DialogTitle>
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
          <div className="bg-white text-black border border-border rounded-lg max-h-[50vh] overflow-y-auto animate-fade-in flex justify-center">
            <style dangerouslySetInnerHTML={{ __html: receiptCSS }} />
            <div className="receipt" dangerouslySetInnerHTML={{ __html: receiptHTML }} />
          </div>
        )}

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          {stripAccents('Não imprimir')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
