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

  const buildReceiptHTML = (): string => {
    const line = (t: string, cls = '') => `<div class="line ${cls}">${h(t)}</div>`;
    const center = (t: string, cls = '') => `<div class="ct ${cls}">${h(t)}</div>`;
    const bold = (t: string, cls = '') => center(t, `b ${cls}`.trim());
    const sep = () => `<div class="sep">────────────────────────────</div>`;
    const row = (left: string, right: string, cls = '') =>
      `<div class="row ${cls}"><span class="row-label">${h(left)}</span><span class="row-value">${h(right)}</span></div>`;
    const block = (lines: string[]) => `<div class="receipt-block">${lines.join('')}</div>`;
    const section = (className: string, blocks: string[]) => `<section class="receipt-section ${className}">${blocks.join('')}</section>`;

    const headerBlocks: string[] = [];
    const contentBlocks: string[] = [];
    const footerBlocks: string[] = [];

    headerBlocks.push(block([
      bold(COMPANY_NAME, 'company'),
      center(`CNPJ: ${COMPANY_CNPJ}`),
      bold('CUPOM FISCAL'),
    ]));

    contentBlocks.push(block([
      sep(),
      bold(`PEDIDO #${sale.code}`),
      center(sale.deliveryMode === 'entrega' ? 'ENTREGA' : 'RETIRADA'),
      center(`${dateStr} - ${timeStr}`),
    ]));

    const custName = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.name || sale.customerName)
      : sale.customerName;
    const custPhone = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.phone || sale.customerContact)
      : sale.customerContact;

    if (custName || custPhone) {
      const customerLines = [sep(), bold('CLIENTE')];
      if (custName) customerLines.push(line(`Nome: ${custName}`));
      if (custPhone) customerLines.push(line(`Tel: ${custPhone}`));
      contentBlocks.push(block(customerLines));
    }

    if (sale.deliveryMode === 'entrega' && sale.deliveryAddress) {
      const addr = sale.deliveryAddress;
      let addrLine = addr.street;
      if (addr.number) addrLine += `, ${addr.number}`;
      if (addr.neighborhood) addrLine += ` - ${addr.neighborhood}`;

      const addressLines = [sep(), bold('ENDERECO DE ENTREGA'), line(addrLine)];
      if (addr.cep) addressLines.push(line(`CEP: ${addr.cep}`));
      if (addr.complement) addressLines.push(line(`Compl: ${addr.complement}`));
      if (addr.reference) addressLines.push(line(`Ref: ${addr.reference}`));
      contentBlocks.push(block(addressLines));
    }

    const itemLines = [sep(), bold('ITENS DO PEDIDO')];

    sale.items.forEach(item => {
      let label = item.product.name;
      if (item.pizzaSize) label = `Pizza ${item.pizzaSize} ${label}`;
      const totalItem = item.calculatedPrice * item.quantity;

      itemLines.push(row(`${item.quantity}x ${label}`, formatCurrency(totalItem)));

      if (item.secondFlavor) {
        itemLines.push(line(`/ ${item.secondFlavor.name}`, 'sub'));
      }
      if (item.border) {
        const borderPrice = item.borderFree ? 'Gratis' : formatCurrency(item.border.price);
        itemLines.push(line(`Borda: ${item.border.name} (${borderPrice})`, 'sub'));
      }
      if (item.freeSoda) {
        itemLines.push(line('Refri gratis', 'sub'));
      }
      item.observations.forEach(obs => {
        itemLines.push(line(obs, 'sub'));
      });
    });

    contentBlocks.push(block(itemLines));

    const subtotal = sale.total - (sale.deliveryFee || 0);
    const totalLines = [
      sep(),
      bold('TOTAIS'),
      row('Subtotal', formatCurrency(subtotal)),
    ];

    if (sale.deliveryFee && sale.deliveryFee > 0) {
      totalLines.push(row('Taxa entrega', formatCurrency(sale.deliveryFee)));
    }

    totalLines.push(row('TOTAL', formatCurrency(sale.total), 'b'));
    contentBlocks.push(block(totalLines));

    const paymentLines = [sep(), bold('PAGAMENTO')];
    sale.payments.forEach(pm => {
      const label = PAYMENT_METHODS.find(m => m.method === pm.method)?.label || pm.method;
      paymentLines.push(row(label, formatCurrency(pm.amount)));
    });
    if (sale.change > 0) {
      paymentLines.push(row('Troco', formatCurrency(sale.change)));
    }
    contentBlocks.push(block(paymentLines));

    if (sale.observations && sale.observations.length > 0) {
      contentBlocks.push(block([
        sep(),
        bold('OBSERVACOES'),
        ...sale.observations.map((observation) => line(observation)),
      ]));
    }

    footerBlocks.push(block([
      sep(),
      bold('Obrigado pela preferencia!'),
      center('Volte sempre.'),
    ]));

    return [
      section('receipt-header', headerBlocks),
      section('receipt-main', contentBlocks),
      section('receipt-footer', footerBlocks),
    ].join('');
  };

  const receiptCSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .receipt {
      font-family: Consolas, 'Courier New', 'Lucida Console', monospace;
      font-size: 13px;
      line-height: 1.28;
      width: 55mm;
      margin: 0 auto;
      padding: 1.5mm 2mm;
      color: #000;
      background: #fff;
      text-align: center;
    }
    .receipt-section {
      width: 100%;
    }
    .receipt-main {
      margin-top: 1.2mm;
    }
    .receipt-footer {
      margin-top: 1.8mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .receipt-block + .receipt-block {
      margin-top: 1.6mm;
    }
    .receipt div,
    .receipt section,
    .receipt span {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }
    .receipt .line,
    .receipt .ct,
    .receipt .sub,
    .receipt .sep {
      text-align: center;
    }
    .receipt .company {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .receipt .b {
      font-weight: 700;
    }
    .receipt .line + .line,
    .receipt .ct + .ct,
    .receipt .row + .row,
    .receipt .row + .sub,
    .receipt .sub + .sub,
    .receipt .line + .row,
    .receipt .ct + .line,
    .receipt .sep + .ct,
    .receipt .sep + .line,
    .receipt .sep + .row {
      margin-top: 0.45mm;
    }
    .receipt .sub {
      font-size: 12px;
      color: #333;
    }
    .receipt .sep {
      color: #888;
      margin-bottom: 0.6mm;
    }
    .receipt .row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 2mm;
      text-align: left;
    }
    .receipt .row-label {
      flex: 1;
      min-width: 0;
      text-align: left;
    }
    .receipt .row-value {
      flex-shrink: 0;
      text-align: right;
      white-space: nowrap;
    }
  `;

  const printCSS = `
    ${receiptCSS}
    @page { size: 55mm auto; margin: 0; }
    body { margin: 0; padding: 0; }
  `;

  const receiptHTML = buildReceiptHTML();

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
