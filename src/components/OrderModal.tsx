import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, Calendar, IndianRupee } from 'lucide-react';
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

  const handleQuantityChange = (index: number, change: number) => {
    const newItems = [...items];
    const newQuantity = Math.max(0, (newItems[index].quantity || 0) + change);
    newItems[index] = { ...newItems[index], quantity: newQuantity };
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
    
    if (status === 'paid') {
      setAmountPaid(totalAmount);
    } else if (status === 'unpaid') {
      setAmountPaid(0);
    }
  };

  const handleAmountPaidChange = (amount: number) => {
    const totalAmount = calculateTotalAmount();
    const validAmount = Math.min(Math.max(0, amount), totalAmount);
    setAmountPaid(validAmount);

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:rounded-2xl sm:w-full sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header - Made sticky */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {order ? 'Edit Order' : 'New Order'}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">{customer.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Order Items Section */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Order Items
            </h3>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-xl space-y-3 sm:space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white capitalize">
                      {item.item_type}
                    </h4>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(index, e.target.value as OrderStatus)}
                      className="w-full sm:w-auto text-sm rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, -1)}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity || 0}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) - (item.quantity || 0))}
                          className="block w-full text-center rounded-lg border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(index, 1)}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IndianRupee className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={item.price || 0}
                          onChange={(e) => handlePriceChange(index, parseInt(e.target.value) || 0)}
                          className="block w-full pl-8 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subtotal
                      </label>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white flex items-center h-[42px] px-3">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        {(item.quantity || 0) * (item.price || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Due Date and Payment Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block w-full pl-10 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => handlePaymentStatusChange(e.target.value as PaymentStatus)}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial_payment">Partial Payment</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Payment Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total
                </label>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {totalAmount}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount Paid
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={amountPaid}
                    onChange={(e) => handleAmountPaidChange(parseFloat(e.target.value) || 0)}
                    className="block w-full pl-8 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pending
                </label>
                <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 flex items-center">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {amountPending}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add any special instructions or notes here..."
            />
          </div>

          {/* Action Buttons - Made sticky */}
          <div className="sticky bottom-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border-2 border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                {order ? 'Update Order' : 'Create Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
