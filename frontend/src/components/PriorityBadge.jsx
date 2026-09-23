import React from 'react';
import { AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const normPriority = (priority || 'medium').toLowerCase();

  const priorityConfig = {
    urgent: { label: 'Urgent', icon: AlertTriangle, className: 'badge-priority-urgent' },
    high: { label: 'High', icon: ArrowUp, className: 'badge-priority-high' },
    medium: { label: 'Medium', icon: ArrowRight, className: 'badge-priority-medium' },
    low: { label: 'Low', icon: ArrowDown, className: 'badge-priority-low' },
  };

  const config = priorityConfig[normPriority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <span className={`badge ${config.className}`}>
      <Icon size={12} />
      <span>{config.label}</span>
    </span>
  );
};
