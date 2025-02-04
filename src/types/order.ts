export type OrderStatus = 'not_started' | 'in_progress' | 'completed' | 'delivered';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial_payment';
export type ItemType = 'shirt' | 'pants' | 'other';

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: ItemType;
  quantity: number;
  status: OrderStatus;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  amount_pending: number;
  payment_status: PaymentStatus;
  notes: string | null;
  items: OrderItem[];
}

export const ITEM_PRICES = {
  shirt: 500,
  pants: 700,
  other: 300,
} as const;

export const ORDER_STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400',
  delivered: 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400',
} as const;

export const PAYMENT_STATUS_COLORS = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400',
  partial_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400',
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400',
} as const;