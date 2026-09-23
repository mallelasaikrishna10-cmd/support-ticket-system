import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Archive } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const normStatus = (status || 'open').toLowerCase();

  const statusConfig = {
    open: { label: 'Open', icon: Clock, className: 'badge-status-open' },
    in_progress: { label: 'In Progress', icon: AlertCircle, className: 'badge-status-in_progress' },
    resolved: { label: 'Resolved', icon: CheckCircle2, className: 'badge-status-resolved' },
    closed: { label: 'Closed', icon: Archive, className: 'badge-status-closed' },
  };

  const config = statusConfig[normStatus] || statusConfig.open;
  const Icon = config.icon;

  return (
    <span className={`badge ${config.className}`}>
      <Icon size={12} />
      <span>{config.label}</span>
    </span>
  );
};
