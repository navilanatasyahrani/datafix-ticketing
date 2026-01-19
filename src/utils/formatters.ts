import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { TicketStatus } from "../types";

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: localeId });
};

export const formatDateShort = (date: string | Date): string => {
  return format(new Date(date), "dd MMM yyyy", { locale: localeId });
};

export const formatRelativeTime = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: localeId,
  });
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case TicketStatus.PENDING:
      return "Pending";
    case TicketStatus.IN_PROGRESS:
      return "In Progress";
    case TicketStatus.RESOLVED:
      return "Resolved";
    case TicketStatus.REJECTED:
      return "Rejected";
    default:
      return status;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case TicketStatus.PENDING:
      return "orange";
    case TicketStatus.IN_PROGRESS:
      return "blue";
    case TicketStatus.RESOLVED:
      return "green";
    case TicketStatus.REJECTED:
      return "red";
    default:
      return "gray";
  }
};

export const getPriorityLabel = (priority: number): string => {
  switch (priority) {
    case 1:
      return "High";
    case 2:
      return "Medium";
    case 3:
      return "Low";
    default:
      return "Unknown";
  }
};

export const getPriorityColor = (priority: number): string => {
  switch (priority) {
    case 1:
      return "red";
    case 2:
      return "orange";
    case 3:
      return "green";
    default:
      return "gray";
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
