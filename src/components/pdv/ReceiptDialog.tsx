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

  const buildReceiptHTML = (): string => {
    const SPACER = '<div class="spacer"></div>';
    const lines: string[] = [];

    // Header - Company
    lines.push(`<div class="center bold company-name">${COMPANY_NAME}</div>`);
    lines.push(`<div class="center cnpj">CNPJ: ${COMPANY_CNPJ}</div>`);
    lines.push(SPACER);

    // Order info
    lines.push(`<div class="center bold section-title">PEDIDO #${sale.code}</div>`);
    lines.push(`<div class="center">${sale.deliveryMode === 'entrega' ? 'ENTREGA' : 'RETIRADA'}</div>`);
    lines.push(`<div class="center">${dateStr} &mdash; ${timeStr}</div>`);
    lines.push(SPACER);

    // Customer
    const custName = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.name || sale.customerName)
      : sale.customerName;
    const custPhone = sale.deliveryMode === 'entrega'
      ? (sale.deliveryAddress?.phone || sale.customerContact)
      : sale.customerContact;

    if (custName || custPhone) {
      lines.push(`<div class="center bold section-title">CLIENTE</div>`);
      if (custName) lines.push(`<div>Nome: ${custName}</div>`);
      if (custPhone) lines.push(`<div>Telefone: ${custPhone}</div>`);
      lines.push(SPACER);
    }

    // Delivery address
    if (sale.deliveryMode === 'entrega' && sale.deliveryAddress) {
      const addr = sale.deliveryAddress;
      lines.push(`<div class="center bold section-title">ENDERE&Ccedil;O DE ENTREGA</div>`);
      let addrLine = addr.street;
      if (addr.number) addrLine += `, ${addr.number}`;
      if (addr.neighborhood) addrLine += ` &mdash; ${addr.neighborhood}`;
      lines.push(`<div>${addrLine}</div>`);
      if (addr.cep) lines.push(`<div>CEP: ${addr.cep}</div>`);
      if (addr.complement) lines.push(`<div>${addr.complement}</div>`);
      if (addr.reference) lines.push(`<div>${addr.reference}</div>`);
      lines.push(SPACER);
    }

    // Items
    lines.push(`<div class="center bold section-title">ITENS DO PEDIDO</div>`);
    lines.push('<div class="spacer-sm"></div>');

    lines.push(`<table><thead><tr><th class="left">Qtd</th><th class="left">Item</th><th class="right">Valor</th></tr></thead><tbody>`);

    sale.items.forEach(item => {
      const label = getItemLabel(item);
      const totalItem = item.calculatedPrice * item.quantity;
      lines.push(`<tr><td>${item.quantity}</td><td>${label}</td><td class="right">${formatCurrency(totalItem)}</td></tr>`);

      if (item.secondFlavor) {
        lines.push(`<tr><td></td><td class="sub">/ ${item.secondFlavor.name}</td><td></td></tr>`);
      }
      if (item.border) {
        const bPrice = item.borderFree ? 'Gr&aacute;tis' : formatCurrency(item.border.price);
        lines.push(`<tr><td></td><td class="sub">Borda: ${item.border.name} (${bPrice})</td><td></td></tr>`);
      }
      item.observations.forEach(obs => {
        lines.push(`<tr><td></td><td class="sub obs">* ${obs}</td><td></td></tr>`);
      });
    });

    lines.push(`</tbody></table>`);
    lines.push(SPACER);

    // Totals
    const subtotal = sale.total - (sale.deliveryFee || 0);
    lines.push(`<div class="row"><span>Itens do pedido</span><span>${formatCurrency(subtotal)}</span></div>`);
    if (sale.deliveryFee && sale.deliveryFee > 0) {
      lines.push(`<div class="row"><span>Taxa de entrega</span><span>${formatCurrency(sale.deliveryFee)}</span></div>`);
    }
    lines.push(`<div class="row bold total-row"><span>TOTAL</span><span>${formatCurrency(sale.total)}</span></div>`);
    lines.push(SPACER);

    // Payment
    lines.push(`<div class="center bold section-title">FORMA DE PAGAMENTO</div>`);
    sale.payments.forEach(p => {
      const label = PAYMENT_METHODS.find(m => m.method === p.method)?.label || p.method;
      lines.push(`<div class="row"><span>${label}</span><span>${formatCurrency(p.amount)}</span></div>`);
    });
    if (sale.change > 0) {
      lines.push(`<div class="row"><span>Troco</span><span>${formatCurrency(sale.change)}</span></div>`);
    }
    lines.push(SPACER);

    // Observations
    if (sale.observations && sale.observations.length > 0) {
      lines.push(`<div class="bold section-title">OBSERVA&Ccedil;&Otilde;ES</div>`);
      sale.observations.forEach(o => lines.push(`<div>${o}</div>`));
      lines.push(SPACER);
    }

    // Footer
    lines.push(`<div class="center bold footer">Obrigado pela prefer&ecirc;ncia! Volte sempre.</div>`);
    lines.push(SPACER);

    return lines.join('\n');
  };

  const receiptCSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 15px;
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
      color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .company-name { font-size: 22px; margin-bottom: 4px; }
    .cnpj { font-size: 14px; margin-bottom: 2px; }
    .section-title { font-size: 16px; margin-bottom: 6px; margin-top: 4px; }
    .spacer { height: 14px; }
    .spacer-sm { height: 6px; }
    .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 15px; }
    .total-row { font-size: 17px; margin-top: 6px; }
    .footer { margin-top: 6px; font-size: 14px; }
    .sub { font-size: 13px; padding-left: 6px; color: #333; }
    .obs { font-style: italic; }
    table { width: 100%; border-collapse: collapse; font-size: 15px; }
    th, td { padding: 4px 0; vertical-align: top; }
    th { font-weight: bold; }
    .left { text-align: left; }
    .right { text-align: right; }
    th:first-child, td:first-child { width: 32px; }
    th:last-child, td:last-child { width: 80px; text-align: right; }
  `;

  const previewCSS = `
    .receipt-preview { font-family: Arial, Helvetica, sans-serif; font-size: 15px; }
    .receipt-preview .center { text-align: center; }
    .receipt-preview .bold { font-weight: bold; }
    .receipt-preview .company-name { font-size: 22px; margin-bottom: 4px; }
    .receipt-preview .cnpj { font-size: 14px; margin-bottom: 2px; }
    .receipt-preview .section-title { font-size: 16px; margin-bottom: 6px; margin-top: 4px; }
    .receipt-preview .spacer { height: 14px; }
    .receipt-preview .spacer-sm { height: 6px; }
    .receipt-preview .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 15px; }
    .receipt-preview .total-row { font-size: 17px; margin-top: 6px; }
    .receipt-preview .footer { margin-top: 6px; font-size: 14px; }
    .receipt-preview .sub { font-size: 13px; padding-left: 6px; color: #333; }
    .receipt-preview .obs { font-style: italic; }
    .receipt-preview table { width: 100%; border-collapse: collapse; font-size: 15px; }
    .receipt-preview th, .receipt-preview td { padding: 4px 0; vertical-align: top; }
    .receipt-preview th { font-weight: bold; }
    .receipt-preview .left { text-align: left; }
    .receipt-preview .right { text-align: right; }
    .receipt-preview th:first-child, .receipt-preview td:first-child { width: 32px; }
    .receipt-preview th:last-child, .receipt-preview td:last-child { width: 80px; text-align: right; }
  `;

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
          <div className="bg-white text-black border border-border rounded-lg p-4 max-h-[45vh] overflow-y-auto animate-fade-in">
            <style dangerouslySetInnerHTML={{ __html: previewCSS }} />
            <div className="receipt-preview" dangerouslySetInnerHTML={{ __html: previewHTML }} />
          </div>
        )}

        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
          Não imprimir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
