import { useState } from 'react';
import { ProductGrid } from '@/components/pdv/ProductGrid';
import { Cart } from '@/components/pdv/Cart';
import { PizzaBuilder } from '@/components/pdv/PizzaBuilder';
import { useStore } from '@/store/useStore';

export default function PDV() {
  const { cashRegister } = useStore();
  const [pizzaBuilderOpen, setPizzaBuilderOpen] = useState(false);
  const [selectedPizzaId, setSelectedPizzaId] = useState<string | undefined>();
  const isOpen = cashRegister && !cashRegister.closedAt;

  const handlePizzaClick = (productId: string) => {
    setSelectedPizzaId(productId);
    setPizzaBuilderOpen(true);
  };

  return (
    <div className="flex gap-4 p-4 h-[calc(100vh-3.5rem)] overflow-hidden">
      {!isOpen && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-fade-in">
          ⚠️ Caixa fechado! Abra o caixa para realizar vendas.
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
