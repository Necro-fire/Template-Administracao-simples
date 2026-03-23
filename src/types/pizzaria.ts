export type Category = 'pizza' | 'hamburguer' | 'bebida' | 'porcao' | 'extras' | 'outros';

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'pizza', label: 'Pizza', icon: '🍕' },
  { value: 'hamburguer', label: 'Hambúrguer', icon: '🍔' },
  { value: 'bebida', label: 'Bebida', icon: '🥤' },
  { value: 'porcao', label: 'Porção', icon: '🍟' },
  { value: 'extras', label: 'Extras', icon: '➕' },
  { value: 'outros', label: 'Outros', icon: '📦' },
];

export type PizzaSize = 'P' | 'M' | 'G' | 'GG';
export type PizzaType = 'tradicional' | 'especial1' | 'especial2' | 'doce';

export const PIZZA_SIZES: { value: PizzaSize; label: string }[] = [
  { value: 'P', label: 'Pequena' },
  { value: 'M', label: 'Média' },
  { value: 'G', label: 'Grande' },
  { value: 'GG', label: 'Gigante' },
];

export const PIZZA_TYPES: { value: PizzaType; label: string }[] = [
  { value: 'tradicional', label: 'Tradicional' },
  { value: 'especial1', label: 'Especial 1' },
  { value: 'especial2', label: 'Especial 2' },
  { value: 'doce', label: 'Doce' },
];

export interface Product {
  id: string;
  name: string;
  category: Category;
  icon: string;
  price: number;
  cost: number;
  active: boolean;
  observations?: string[];
  pizzaType?: PizzaType;
  pizzaPrices?: Record<PizzaSize, number>;
  pizzaCosts?: Record<PizzaSize, number>;
}

export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito';

export const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: string }[] = [
  { method: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { method: 'pix', label: 'Pix', icon: '📱' },
  { method: 'debito', label: 'Débito', icon: '💳' },
  { method: 'credito', label: 'Crédito', icon: '💳' },
];

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  observations: string[];
  pizzaSize?: PizzaSize;
  secondFlavor?: Product;
  calculatedPrice: number;
}

export interface Sale {
  id: string;
  code: string;
  items: CartItem[];
  payments: PaymentSplit[];
  total: number;
  change: number;
  date: string;
  customerName: string;
  customerContact: string;
  observations: string[];
  cancelled: boolean;
  cancelledAt?: string;
}

export type MovementType = 'entry' | 'exit' | 'sangria' | 'reforco';

export interface CashMovement {
  id: string;
  type: MovementType;
  amount: number;
  description: string;
  paymentMethod?: PaymentMethod;
  date: string;
  origin?: 'manual' | 'pdv';
}

export interface CashRegister {
  id: string;
  openedAt: string;
  closedAt?: string;
  initialAmount: number;
  informedAmount?: number;
  sales: Sale[];
  entries: CashMovement[];
  exits: CashMovement[];
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  user: string;
  date: string;
}
