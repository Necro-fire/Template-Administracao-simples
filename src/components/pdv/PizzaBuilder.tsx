import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { PizzaSize, PIZZA_SIZES, PIZZA_TYPES, Product, PizzaType } from '@/types/pizzaria';
import { formatCurrency } from '@/lib/format';

interface PizzaBuilderProps {
  open: boolean;
  onClose: () => void;
  initialFlavorId?: string;
}

export function PizzaBuilder({ open, onClose, initialFlavorId }: PizzaBuilderProps) {
  const { products, addToCart } = useStore();
  const pizzas = products.filter((p) => p.category === 'pizza' && p.active);

  const [size, setSize] = useState<PizzaSize>('G');
  const [flavor1Id, setFlavor1Id] = useState(initialFlavorId || '');
  const [flavor2Id, setFlavor2Id] = useState('');
  const [twoFlavors, setTwoFlavors] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PizzaType | 'all'>('all');

  const flavor1 = pizzas.find((p) => p.id === flavor1Id);
  const flavor2 = pizzas.find((p) => p.id === flavor2Id);

  const getPrice = (product: Product, sz: PizzaSize) => product.pizzaPrices?.[sz] || 0;

  const calculatePrice = () => {
    if (!flavor1) return 0;
    const p1 = getPrice(flavor1, size);
    if (!twoFlavors || !flavor2) return p1;
    const p2 = getPrice(flavor2, size);
    return p1 / 2 + p2 / 2;
  };

  const filteredPizzas = typeFilter === 'all' ? pizzas : pizzas.filter((p) => p.pizzaType === typeFilter);

  const handleAdd = () => {
    if (!flavor1) return;
    const price = calculatePrice();
    addToCart({
      id: crypto.randomUUID(),
      product: flavor1,
      quantity: 1,
      observations: [],
      pizzaSize: size,
      secondFlavor: twoFlavors ? flavor2 : undefined,
      calculatedPrice: price,
    });
    onClose();
    resetState();
  };

  const resetState = () => {
    setSize('G');
    setFlavor1Id('');
    setFlavor2Id('');
    setTwoFlavors(false);
    setTypeFilter('all');
  };

  // Set initial flavor when dialog opens
  useState(() => {
    if (initialFlavorId) setFlavor1Id(initialFlavorId);
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); resetState(); } }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🍕 Montar Pizza</DialogTitle>
        </DialogHeader>

        {/* Size */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Tamanho</label>
          <div className="grid grid-cols-4 gap-2">
            {PIZZA_SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSize(s.value)}
                className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                  size === s.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.value}
                <span className="block text-[10px] font-normal">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2 flavors toggle */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground">Sabores:</label>
          <button
            onClick={() => { setTwoFlavors(false); setFlavor2Id(''); }}
            className={`px-3 py-1 rounded text-xs font-medium ${!twoFlavors ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            1 Sabor
          </button>
          <button
            onClick={() => setTwoFlavors(true)}
            className={`px-3 py-1 rounded text-xs font-medium ${twoFlavors ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            2 Sabores
          </button>
        </div>

        {/* Type filter */}
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setTypeFilter('all')} className={`px-2 py-1 rounded text-[10px] font-medium ${typeFilter === 'all' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>
            Todos
          </button>
          {PIZZA_TYPES.map((t) => (
            <button key={t.value} onClick={() => setTypeFilter(t.value)} className={`px-2 py-1 rounded text-[10px] font-medium ${typeFilter === t.value ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Flavor 1 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            {twoFlavors ? '1º Sabor' : 'Sabor'}
          </label>
          <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
            {filteredPizzas.map((p) => (
              <button
                key={p.id}
                onClick={() => setFlavor1Id(p.id)}
                className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  flavor1Id === p.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent'
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="block text-[10px] opacity-75">{formatCurrency(getPrice(p, size))}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Flavor 2 */}
        {twoFlavors && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">2º Sabor</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
              {filteredPizzas.filter((p) => p.id !== flavor1Id).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFlavor2Id(p.id)}
                  className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${
                    flavor2Id === p.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent'
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="block text-[10px] opacity-75">{formatCurrency(getPrice(p, size))}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="glass-card p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pizza {size}</span>
            <span className="font-bold text-primary">{formatCurrency(calculatePrice())}</span>
          </div>
          {flavor1 && <p className="text-xs">• {flavor1.name}</p>}
          {twoFlavors && flavor2 && <p className="text-xs">• {flavor2.name}</p>}
          {twoFlavors && flavor1 && flavor2 && (
            <p className="text-[10px] text-muted-foreground">
              ({formatCurrency(getPrice(flavor1, size))} ÷ 2) + ({formatCurrency(getPrice(flavor2, size))} ÷ 2)
            </p>
          )}
        </div>

        <Button onClick={handleAdd} disabled={!flavor1 || (twoFlavors && !flavor2)} className="w-full bg-primary hover:bg-primary/90 font-bold">
          Adicionar ao Carrinho
        </Button>
      </DialogContent>
    </Dialog>
  );
}
