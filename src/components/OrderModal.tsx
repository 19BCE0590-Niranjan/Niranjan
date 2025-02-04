import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Customer } from '../types/customer';
import { Order, OrderItem, OrderStatus, ItemType, PaymentStatus } from '../types/order';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Partial<Order>, items: Partial<OrderItem>[]) => void;
  customer: Customer;
  order?: Order;
  isDark?: boolean;
}

export function OrderModal({ isOpen, onClose, onSave, customer, order }: OrderModalProps) {
  const [items, setItems] = useState<Partial<OrderItem>[]>([
    { item_type: 'shirt', quantity: 0, status: 'not_started', price: 0 },
    { item_type: 'pants', quantity: 0, status: 'not_started', price: 0 },
    { item_type: 'other', quantity: 0, status: 'not_started', price: 0 },
  ]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (order) {
      // Initialize with existing order data
      const existingItems = ['shirt', 'pants', 'other'].map((type) => {
        const item = order.items?.find((i) => i.item_type === type);
        return item || { item_type: type as ItemType, quantity: 0, status: 'not_started' as OrderStatus, price: 0 };
      });
      setItems(existingItems);
      setDueDate(order.due_date.split('T')[0]);
      setPaymentStatus(order.payment_status);
      setAmountPaid(order.amount_paid);
      setNotes(order.notes || '');
    } else {
      // Reset form for new order
      setItems([
        { item_type: 'shirt', quantity: 0, status: 'not_started', price: 0 },
        { item_type: 'pants', quantity: 0, status: 'not_started', price: 0 },
        { item_type: 'other', quantity: 0, status: 'not_started', price: 0 },
      ]);
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setPaymentStatus('unpaid');
      setAmountPaid(0);
      setNotes('');
    }
  }, [order]);

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], quantity };
    setItems(newItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], price };
    setItems(newItems);
  };

  const handleStatusChange = (index: number, status: OrderStatus) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], status };
    setItems(newItems);
  };

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  };

  const handlePaymentStatusChange = (status: PaymentStatus) => {
    const totalAmount = calculateTotalAmount();
    setPaymentStatus(status);
    
    // Set amount paid based on payment status
    if (status === 'paid') {
      setAmountPaid(totalAmount);
    } else if (status === 'unpaid') {
      setAmountPaid(0);
    }
    // For partial_payment, keep the current amount_paid
  };

  const handleAmountPaidChange = (amount: number) => {
    const totalAmount = calculateTotalAmount();
    const validAmount = Math.min(Math.max(0, amount), totalAmount);
    setAmountPaid(validAmount);

    // Update payment status based on amount paid
    if (validAmount === 0) {
      setPaymentStatus('unpaid');
    } else if (validAmount === totalAmount) {
      setPaymentStatus('paid');
    } else {
      setPaymentStatus('partial_payment');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = calculateTotalAmount();
    
    onSave(
      {
        due_date: dueDate,
        payment_status: paymentStatus,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        notes,
      },
      items
    );
  };

  if (!isOpen) return null;

  const totalAmount = calculateTotalAmount();
  const amountPending = totalAmount - amountPaid;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {order ? 'Edit Order' : 'New Order'} - {customer.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Items</h3>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {item.item_type?.charAt(0).toUpperCase()}{item.item_type?.slice(1)} Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={item.quantity || 0}
                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={item.price || 0}
                    onChange={(e) => handlePriceChange(index, parseInt(e.target.value) || 0)}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(index, e.target.value as OrderStatus)}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Subtotal: ₹{(item.quantity || 0) * (item.price || 0)}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial_payment">Partial Payment</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Amount
              </label>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ₹{totalAmount}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount Paid
              </label>
              <input
                type="number"
                min="0"
                max={totalAmount}
                value={amountPaid}
                onChange={(e) => handleAmountPaidChange(parseFloat(e.target.value) || 0)}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount Pending
              </label>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ₹{amountPending}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            >
              {order ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}