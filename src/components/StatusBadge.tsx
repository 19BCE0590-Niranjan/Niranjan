import React from 'react';
import { OrderStatus, PaymentStatus, ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '../types/order';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus;
  type: 'order' | 'payment';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const colors = type === 'order' ? ORDER_STATUS_COLORS : PAYMENT_STATUS_COLORS;
  const displayStatus = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
      {displayStatus}
    </span>
  );
}