import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const formatDate = (date) =>
  format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });

export const formatDateShort = (date) =>
  format(new Date(date), "dd/MM/yyyy", { locale: es });

export const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
