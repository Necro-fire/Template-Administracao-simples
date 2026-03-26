import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, Sale, CashRegister, CashMovement, PaymentSplit, AuditLog, PizzaSize, PizzaBorder, FreeBorderRule, FreeSodaRule } from '@/types/pizzaria';

const DEMO_PRODUCTS: Product[] = [
  // Pizzas - Tradicional
  { id: 'p1', name: 'Calabresa', category: 'pizza', icon: '🍕', price: 0, cost: 0, active: true, pizzaType: 'tradicional', pizzaPrices: { P: 25, M: 35, G: 45, GG: 55 }, pizzaCosts: { P: 8, M: 12, G: 16, GG: 20 } },
  { id: 'p2', name: 'Margherita', category: 'pizza', icon: '🍕', price: 0, cost: 0, active: true, pizzaType: 'tradicional', pizzaPrices: { P: 25, M: 35, G: 45, GG: 55 }, pizzaCosts: { P: 8, M: 12, G: 16, GG: 20 } },
  { id: 'p3', name: 'Mussarela', category: 'pizza', icon: '🍕', price: 0, cost: 0, active: true, pizzaType: 'tradicional', pizzaPrices: { P: 22, M: 32, G: 42, GG: 52 }, pizzaCosts: { P: 7, M: 10, G: 14, GG: 18 } },
  { id: 'p4', name: 'Portuguesa', category: 'pizza', icon: '🍕', price: 0, cost: 0, active: true, pizzaType: 'tradicional', pizzaPrices: { P: 28, M: 38, G: 48, GG: 58 }, pizzaCosts: { P: 9, M: 13, G: 17, GG: 21 } },
  // Pizzas - Especial 1
  { id: 'p5', name: '4 Queijos', category: 'pizza', icon: '🍕', price: 0, cost: 0, active: true, pizzaType: 'especial1', pizzaPrices: { P: 30, M: 42, G: 52, GG: 62 }, pizzaCosts: { P: 10, M: 15, G: 19, GG: 23 } },
  { id: 'p6', name: 'Frango c/ Catupiry', category: 'pizza', icon: '🍕', price: 0, cost: 0, active: true, pizzaType: 'especial1', pizzaPrices: { P: 30, M: 42, G: 52, GG: 62 }, pizzaCosts: { P: 10, M: 15, G: 19, GG: 23 } },
  // Pizzas - Especial 2
  { id: 'p7', name: 'Camarão', category: 'pizza', icon: '🍕', price: 0, cost: 0, active: true, pizzaType: 'especial2', pizzaPrices: { P: 35, M: 48, G: 60, GG: 72 }, pizzaCosts: { P: 14, M: 20, G: 26, GG: 32 } },
  { id: 'p8', name: 'Lombo Canadense', category: 'pizza', icon: '🍕', price: 0, cost: 0, active: true, pizzaType: 'especial2', pizzaPrices: { P: 33, M: 45, G: 57, GG: 68 }, pizzaCosts: { P: 12, M: 18, G: 24, GG: 30 } },
  // Pizzas - Doce
  { id: 'p9', name: 'Chocolate', category: 'pizza', icon: '🍫', price: 0, cost: 0, active: true, pizzaType: 'doce', pizzaPrices: { P: 28, M: 38, G: 48, GG: 58 }, pizzaCosts: { P: 9, M: 13, G: 17, GG: 21 } },
  { id: 'p10', name: 'Banana c/ Canela', category: 'pizza', icon: '🍌', price: 0, cost: 0, active: true, pizzaType: 'doce', pizzaPrices: { P: 26, M: 36, G: 46, GG: 56 }, pizzaCosts: { P: 8, M: 12, G: 16, GG: 20 } },
  // Hambúrgueres
  { id: 'h1', name: 'X-Burger', category: 'hamburguer', icon: '🍔', price: 22, cost: 10, active: true },
  { id: 'h2', name: 'X-Bacon', category: 'hamburguer', icon: '🍔', price: 28, cost: 13, active: true },
  { id: 'h3', name: 'X-Tudo', category: 'hamburguer', icon: '🍔', price: 32, cost: 15, active: true },
  // Bebidas
  { id: 'b1', name: 'Coca-Cola 2L', category: 'bebida', icon: '🥤', price: 12, cost: 6, active: true },
  { id: 'b2', name: 'Guaraná 2L', category: 'bebida', icon: '🥤', price: 10, cost: 5, active: true },
  { id: 'b3', name: 'Suco Natural', category: 'bebida', icon: '🧃', price: 8, cost: 3, active: true },
  { id: 'b4', name: 'Água Mineral', category: 'bebida', icon: '💧', price: 4, cost: 1.5, active: true },
  // Porções
  { id: 'po1', name: 'Batata Frita', category: 'porcao', icon: '🍟', price: 18, cost: 6, active: true },
  { id: 'po2', name: 'Onion Rings', category: 'porcao', icon: '🧅', price: 20, cost: 7, active: true },
  // Extras
  { id: 'e1', name: 'Borda Recheada', category: 'extras', icon: '🧀', price: 8, cost: 3, active: true },
  { id: 'e2', name: 'Molho Extra', category: 'extras', icon: '🫙', price: 3, cost: 0.8, active: true },
  // Outros
  { id: 'o1', name: 'Sobremesa do Dia', category: 'outros', icon: '🍰', price: 15, cost: 5, active: true },
];

const DEMO_BORDERS: PizzaBorder[] = [
  { id: 'bd1', name: 'Catupiry', price: 8, category: 'tradicional', active: true, freeSizes: ['G', 'GG'] },
  { id: 'bd2', name: 'Cheddar', price: 8, category: 'tradicional', active: true, freeSizes: ['G', 'GG'] },
  { id: 'bd3', name: 'Cream Cheese', price: 10, category: 'premium', active: true, freeSizes: ['GG'] },
  { id: 'bd4', name: 'Chocolate', price: 10, category: 'premium', active: true, freeSizes: [] },
  { id: 'bd5', name: 'Doce de Leite', price: 10, category: 'premium', active: true, freeSizes: [] },
];

const DEMO_SODAS: Product[] = [
  { id: 'soda1', name: 'Coca-Cola 1L', category: 'bebida', icon: '🥤', price: 8, cost: 4, active: true },
  { id: 'soda2', name: 'Guaraná 1L', category: 'bebida', icon: '🥤', price: 7, cost: 3.5, active: true },
  { id: 'soda3', name: 'Fanta Laranja 1L', category: 'bebida', icon: '🥤', price: 7, cost: 3.5, active: true },
  { id: 'soda4', name: 'Sprite 1L', category: 'bebida', icon: '🥤', price: 7, cost: 3.5, active: true },
];

interface AppState {
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;

  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;

  sales: Sale[];
  nextSaleCode: number;
  finalizeSale: (payments: PaymentSplit[], change: number, customerName: string, customerContact: string, observations: string[]) => Sale;
  cancelSale: (saleId: string) => void;

  cashRegister: CashRegister | null;
  cashHistory: CashRegister[];
  openRegister: (initialAmount: number) => void;
  closeRegister: (informedAmount?: number) => void;
  addMovement: (m: Omit<CashMovement, 'id' | 'date'>) => void;
  deleteMovement: (movementId: string) => void;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;

  // Borders
  borders: PizzaBorder[];
  addBorder: (b: PizzaBorder) => void;
  updateBorder: (b: PizzaBorder) => void;
  deleteBorder: (id: string) => void;

  // Free rules
  freeBorderRules: FreeBorderRule[];
  setFreeBorderRules: (rules: FreeBorderRule[]) => void;
  freeSodaRules: FreeSodaRule[];
  setFreeSodaRules: (rules: FreeSodaRule[]) => void;

  // Soda products for free soda
  sodaProducts: Product[];
  setSodaProducts: (products: Product[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: DEMO_PRODUCTS,
      addProduct: (p) => {
        set((s) => ({ products: [...s.products, p] }));
        get().addAuditLog('PRODUCT_ADD', `Produto criado: ${p.name}`);
      },
      updateProduct: (p) => {
        set((s) => ({ products: s.products.map((x) => (x.id === p.id ? p : x)) }));
        get().addAuditLog('PRODUCT_UPDATE', `Produto atualizado: ${p.name}`);
      },
      deleteProduct: (id) => {
        const product = get().products.find(p => p.id === id);
        set((s) => ({ products: s.products.filter((x) => x.id !== id) }));
        get().addAuditLog('PRODUCT_DELETE', `Produto removido: ${product?.name || id}`);
      },

      cart: [],
      addToCart: (item) => set((s) => ({ cart: [...s.cart, item] })),
      removeFromCart: (itemId) => set((s) => ({ cart: s.cart.filter((i) => i.id !== itemId) })),
      updateCartItem: (itemId, updates) =>
        set((s) => ({
          cart: s.cart.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
        })),
      clearCart: () => set({ cart: [] }),

      sales: [],
      nextSaleCode: 1,
      finalizeSale: (payments, change, customerName, customerContact, observations) => {
        const state = get();
        const total = state.cart.reduce((sum, i) => sum + i.calculatedPrice * i.quantity, 0);
        const sale: Sale = {
          id: crypto.randomUUID(),
          code: String(state.nextSaleCode).padStart(6, '0'),
          items: [...state.cart],
          payments,
          total,
          change,
          date: new Date().toISOString(),
          customerName,
          customerContact,
          observations,
          cancelled: false,
        };
        const reg = state.cashRegister;
        set({
          sales: [...state.sales, sale],
          nextSaleCode: state.nextSaleCode + 1,
          cart: [],
          cashRegister: reg && !reg.closedAt ? { ...reg, sales: [...reg.sales, sale] } : reg,
        });
        get().addAuditLog('SALE', `Venda ${sale.code} - Total: R$ ${total.toFixed(2)}`);
        return sale;
      },
      cancelSale: (saleId) =>
        set((s) => {
          const sale = s.sales.find(sl => sl.id === saleId);
          if (!sale || sale.cancelled) return {};
          const updatedSale = { ...sale, cancelled: true, cancelledAt: new Date().toISOString() };
          const updatedSales = s.sales.map(sl => sl.id === saleId ? updatedSale : sl);
          const reg = s.cashRegister;
          const updatedReg = reg ? {
            ...reg,
            sales: reg.sales.map(sl => sl.id === saleId ? updatedSale : sl),
          } : reg;
          get().addAuditLog('SALE_CANCEL', `Venda ${sale.code} cancelada`);
          return { sales: updatedSales, cashRegister: updatedReg };
        }),

      cashRegister: null,
      cashHistory: [],
      openRegister: (initialAmount) => {
        set({
          cashRegister: {
            id: crypto.randomUUID(),
            openedAt: new Date().toISOString(),
            initialAmount,
            sales: [],
            entries: [],
            exits: [],
          },
        });
        get().addAuditLog('REGISTER_OPEN', `Caixa aberto com R$ ${initialAmount.toFixed(2)}`);
      },
      closeRegister: (informedAmount) =>
        set((s) => {
          if (!s.cashRegister) return {};
          const closed = { ...s.cashRegister, closedAt: new Date().toISOString(), informedAmount };
          get().addAuditLog('REGISTER_CLOSE', `Caixa fechado`);
          return { cashRegister: null, cashHistory: [...s.cashHistory, closed] };
        }),
      addMovement: (m) =>
        set((s) => {
          if (!s.cashRegister) return {};
          const movement: CashMovement = { ...m, id: crypto.randomUUID(), date: new Date().toISOString() };
          const isEntry = m.type === 'entry' || m.type === 'reforco';
          return {
            cashRegister: {
              ...s.cashRegister,
              entries: isEntry ? [...s.cashRegister.entries, movement] : s.cashRegister.entries,
              exits: !isEntry ? [...s.cashRegister.exits, movement] : s.cashRegister.exits,
            },
          };
        }),
      deleteMovement: (movementId) =>
        set((s) => {
          if (!s.cashRegister) return {};
          get().addAuditLog('MOVEMENT_DELETE', `Movimentação removida`);
          return {
            cashRegister: {
              ...s.cashRegister,
              entries: s.cashRegister.entries.filter(e => e.id !== movementId),
              exits: s.cashRegister.exits.filter(e => e.id !== movementId),
            },
          };
        }),

      auditLogs: [],
      addAuditLog: (action, details) =>
        set((s) => ({
          auditLogs: [
            { id: crypto.randomUUID(), action, details, user: 'system', date: new Date().toISOString() },
            ...s.auditLogs,
          ].slice(0, 500),
        })),

      // Borders
      borders: DEMO_BORDERS,
      addBorder: (b) => set((s) => ({ borders: [...s.borders, b] })),
      updateBorder: (b) => set((s) => ({ borders: s.borders.map(x => x.id === b.id ? b : x) })),
      deleteBorder: (id) => set((s) => ({ borders: s.borders.filter(x => x.id !== id) })),

      // Free rules
      freeBorderRules: [
        { size: 'G', enabled: true },
        { size: 'GG', enabled: true },
      ],
      setFreeBorderRules: (rules) => set({ freeBorderRules: rules }),
      freeSodaRules: [
        { size: 'G', enabled: false },
        { size: 'GG', enabled: true },
      ],
      setFreeSodaRules: (rules) => set({ freeSodaRules: rules }),

      // Soda products for free soda
      sodaProducts: DEMO_SODAS,
      setSodaProducts: (products) => set({ sodaProducts: products }),
    }),
    { name: 'bella-pizza-store' }
  )
);
