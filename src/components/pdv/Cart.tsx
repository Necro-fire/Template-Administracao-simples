import { useState } from 'react';
import { Minus, Plus, Trash2, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { PaymentMethod, PAYMENT_METHODS, PaymentSplit } from '@/types/pizzaria';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export function Cart() {
  const { cart, removeFromCart, updateCartItem, clearCart, finalizeSale, cashRegister } = useStore();
  const [showPayment, setShowPayment] = useState(false);
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null);
  const [currentAmount, setCurrentAmount] = useState('');
  const [splitMode, setSplitMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [obsInput, setObsInput] = useState('');
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showReceiptConfirm, setShowReceiptConfirm] = useState(false);

  const total = cart.reduce((s, i) => s + i.calculatedPrice * i.quantity, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = total - totalPaid;
  const change = totalPaid > total ? totalPaid - total : 0;

  const addPayment = () => {
    const amount = parseFloat(currentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor inválido');
      return;
    }
    setPayments([...payments, { method: currentMethod!, amount }]);
    setCurrentAmount('');
  };

  const payFull = (method: PaymentMethod) => {
    if (!splitMode) {
      setPayments([{ method, amount: total }]);
      setCurrentMethod(method);
    }
  };

  const handleFinalize = () => {
    if (!cashRegister) {
      toast.error('Abra o caixa antes de vender!');
      return;
    }
    if (cashRegister.closedAt) {
      toast.error('O caixa está fechado!');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Informe o nome do cliente');
      return;
    }
    if (totalPaid < total) {
      toast.error('Pagamento insuficiente');
      return;
    }
    const sale = finalizeSale(payments, change, customerName.trim(), customerContact.trim(), []);
    setLastSale(sale);
    setPayments([]);
    setShowPayment(false);
    setSplitMode(false);
    setCurrentMethod(null);
    setCustomerName('');
    setCustomerContact('');
    toast.success('Venda finalizada!');

    setShowReceiptConfirm(true);
  };

  const addObservation = (itemId: string) => {
    if (!obsInput.trim()) return;
    const item = cart.find((i) => i.id === itemId);
    if (item) {
      updateCartItem(itemId, { observations: [...item.observations, obsInput.trim()] });
      setObsInput('');
      setEditingObsId(null);
    }
  };

  const removeObservation = (itemId: string, obsIndex: number) => {
    const item = cart.find((i) => i.id === itemId);
    if (item) {
      updateCartItem(itemId, { observations: item.observations.filter((_, i) => i !== obsIndex) });
    }
  };

  const getItemLabel = (item: typeof cart[0]) => {
    let label = item.product.name;
    if (item.pizzaSize) label = `Pizza ${item.pizzaSize} ${label}`;
    if (item.secondFlavor) label += ` / ${item.secondFlavor.name}`;
    return label;
  };

  if (cart.length === 0 && !showReceipt) {
    return (
      <div className="w-80 glass-card p-4 flex flex-col items-center justify-center gap-2 shrink-0">
        <span className="text-4xl">🛒</span>
        <p className="text-muted-foreground text-sm">Carrinho vazio</p>
        <p className="text-muted-foreground text-xs">Clique em um produto para adicionar</p>
      </div>
    );
  }

  return (
    <div className="w-80 glass-card flex flex-col shrink-0 animate-slide-in-right">
      <div className="p-3 border-b border-border">
        <h2 className="font-bold text-sm">Carrinho ({cart.reduce((s, i) => s + i.quantity, 0)} itens)</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[35vh]">
        {cart.map((item) => (
          <div key={item.id} className="bg-secondary rounded-lg p-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{item.product.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{getItemLabel(item)}</p>
                <p className="text-primary text-xs font-bold">{formatCurrency(item.calculatedPrice * item.quantity)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                <button onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })} className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
                <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
                <button onClick={() => setEditingObsId(editingObsId === item.id ? null : item.id)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <MessageSquare className="w-3 h-3" />
                </button>
              </div>
            </div>
            {/* Observations */}
            {item.observations.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {item.observations.map((obs, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] text-warning">
                    <span>• {obs}</span>
                    <button onClick={() => removeObservation(item.id, i)} className="text-destructive hover:text-destructive/80">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {editingObsId === item.id && (
              <div className="flex gap-1 mt-1">
                <Input value={obsInput} onChange={(e) => setObsInput(e.target.value)} placeholder="Observação..." className="bg-muted border-border h-7 text-xs" onKeyDown={(e) => e.key === 'Enter' && addObservation(item.id)} />
                <Button size="sm" onClick={() => addObservation(item.id)} className="h-7 text-xs px-2">+</Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3 space-y-3">
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>

        {!showPayment ? (
          <div className="flex gap-2">
            <Button onClick={() => setShowPayment(true)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Pagamento
            </Button>
            <Button onClick={clearCart} variant="outline" size="icon">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {/* Customer info */}
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome do cliente *" className="bg-secondary border-border h-8 text-xs" />
            <Input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="Contato (telefone/whatsapp)" className="bg-secondary border-border h-8 text-xs" />

            {/* Split mode toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSplitMode(!splitMode); setPayments([]); }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${splitMode ? 'bg-info text-info-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                Dividir Pagamento
              </button>
            </div>

            {/* Payment methods */}
            {payments.length > 0 && (
              <div className="space-y-1">
                {payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-success/10 rounded px-2 py-1 text-xs">
                    <span className="capitalize">{PAYMENT_METHODS.find(m => m.method === p.method)?.label || p.method}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-success font-medium">{formatCurrency(p.amount)}</span>
                      {splitMode && (
                        <button onClick={() => setPayments(payments.filter((_, j) => j !== i))} className="text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(splitMode ? remaining > 0 : payments.length === 0) && (
              <>
                <div className="grid grid-cols-2 gap-1">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.method}
                      onClick={() => {
                        setCurrentMethod(pm.method);
                        if (!splitMode) payFull(pm.method);
                      }}
                      className={`flex items-center justify-center gap-1 py-2 rounded text-xs font-medium transition-colors ${
                        currentMethod === pm.method ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <span>{pm.icon}</span>
                      {pm.label}
                    </button>
                  ))}
                </div>
                {splitMode && currentMethod && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={`Restante: ${formatCurrency(remaining)}`}
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="bg-secondary border-border h-8 text-xs"
                    />
                    <Button onClick={addPayment} variant="outline" size="sm" className="h-8">+</Button>
                  </div>
                )}
              </>
            )}

            {remaining <= 0 && change > 0 && (
              <div className="flex justify-between text-warning font-bold text-sm bg-warning/10 rounded px-2 py-1">
                <span>Troco</span>
                <span>{formatCurrency(change)}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleFinalize}
                disabled={totalPaid < total || !customerName.trim()}
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground font-bold disabled:opacity-50"
              >
                Finalizar Venda
              </Button>
              <Button onClick={() => { setShowPayment(false); setPayments([]); setSplitMode(false); setCurrentMethod(null); }} variant="outline" size="sm">
                Voltar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>

    <AlertDialog open={showReceiptConfirm} onOpenChange={setShowReceiptConfirm}>
      <AlertDialogContent className="bg-card border-border max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Gerar nota?</AlertDialogTitle>
          <AlertDialogDescription>Deseja gerar a nota desta venda?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border" onClick={() => setShowReceiptConfirm(false)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-primary hover:bg-primary/90" onClick={() => { setShowReceipt(true); setShowReceiptConfirm(false); }}>Gerar Nota</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
