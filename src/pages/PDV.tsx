import { useState, useEffect, useRef } from 'react';
import { ProductGrid } from '@/components/pdv/ProductGrid';
import { Cart } from '@/components/pdv/Cart';
import { PizzaBuilder } from '@/components/pdv/PizzaBuilder';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export default function PDV() {
  const { cashRegister, cart } = useStore();
  const [pizzaBuilderOpen, setPizzaBuilderOpen] = useState(false);
  const [selectedPizzaId, setSelectedPizzaId] = useState<string | undefined>();
  const isOpen = cashRegister && !cashRegister.closedAt;
  const prevCartLength = useRef(cart.length);

  // Alert when product is added with closed register
  useEffect(() => {
    if (cart.length > prevCartLength.current && !isOpen) {
      toast.error('⚠️ Caixa fechado! Abra o caixa antes de finalizar a venda.', {
        duration: 5000,
        style: { background: 'hsl(0, 84%, 20%)', border: '1px solid hsl(0, 84%, 40%)', color: 'white' },
      });
    }
    prevCartLength.current = cart.length;
  }, [cart.length, isOpen]);

  const handlePizzaClick = (productId: string) => {
    setSelectedPizzaId(productId);
    setPizzaBuilderOpen(true);
  };

  return (
    <div className="flex gap-4 p-4 h-[calc(100vh-3.5rem)] overflow-hidden">
      {!isOpen && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-destructive/90 text-destructive-foreground px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg animate-fade-in backdrop-blur-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
          Caixa fechado — Abra o caixa para realizar vendas
        </div>
      )}
      <ProductGrid onPizzaClick={handlePizzaClick} />
      <Cart />
      <PizzaBuilder
        open={pizzaBuilderOpen}
        onClose={() => { setPizzaBuilderOpen(false); setSelectedPizzaId(undefined); }}
        initialFlavorId={selectedPizzaId}
      />
    </div>
  );
}
