import React from 'react';
import { Pencil, Trash2, Phone, PlusCircle } from 'lucide-react';
import { Customer } from '../types/customer';
import { Order } from '../types/order';
import { StatusBadge } from './StatusBadge';

interface CustomerCardProps {
  customer: Customer;
  orders?: Order[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onAddOrder: (customer: Customer) => void;
  onEditOrder: (order: Order) => void;
}

export function CustomerCard({ 
  customer, 
  orders = [], 
  onEdit, 
  onDelete,
  onAddOrder,
  onEditOrder
}: CustomerCardProps) {
  const activeOrders = orders.filter(order => 
    order.items?.some(item => item.status !== 'delivered')
  );

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <img
              src={customer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=6366f1&color=fff`}
              alt={customer.name}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white break-words">
              {customer.name}
            </h3>
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center text-base text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mt-1"
            >
              <Phone className="h-4 w-4 mr-1.5" />
              {customer.phone}
            </a>
          </div>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddOrder(customer)}
              className="p-2.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 rounded-lg transition-colors"
              title="Add order"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
            <button
              onClick={() => onEdit(customer)}
              className="p-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
              title="Edit customer"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(customer)}
              className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
              title="Delete customer"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {activeOrders.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Active Orders
            </h4>
            <div className="space-y-4">
              {activeOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => onEditOrder(order)}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Due: {new Date(order.due_date).toLocaleDateString()}
                      </span>
                      <StatusBadge status={order.payment_status} type="payment" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.items && order.items.map(item => (
                      item.quantity > 0 && (
                        <div key={item.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.quantity}×
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white capitalize min-w-[60px]">
                              {item.item_type}
                            </span>
                            <StatusBadge status={item.status} type="order" />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      )
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          ₹{order.total_amount}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Paid</span>
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ₹{order.amount_paid}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Pending</span>
                        <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                          ₹{order.amount_pending}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/50">
        {customer.shirt_measurements && (
          <div>
            <dt className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Shirt Measurements
            </dt>
            <dd className="text-base text-gray-900 dark:text-gray-100 font-medium">
              {customer.shirt_measurements}
            </dd>
          </div>
        )}
        {customer.pants_measurements && (
          <div>
            <dt className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Pants Measurements
            </dt>
            <dd className="text-base text-gray-900 dark:text-gray-100 font-medium">
              {customer.pants_measurements}
            </dd>
          </div>
        )}
        {customer.other_measurements && (
          <div>
            <dt className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Other Measurements
            </dt>
            <dd className="text-base text-gray-900 dark:text-gray-100 font-medium">
              {customer.other_measurements}
            </dd>
          </div>
        )}
      </div>
    </div>
  );
}
