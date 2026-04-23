export const MIN_TICKETS_PER_PURCHASE = 3;
export const FINAL_TICKETS_EXCEPTION_MAX = 2;

export function normalizeTicketQuantityInput(value: number) {
  if (!Number.isFinite(value)) return MIN_TICKETS_PER_PURCHASE;
  return Math.max(1, Math.trunc(value));
}

export function getDefaultTicketQuantity(availableTickets?: number) {
  if (typeof availableTickets === "number" && availableTickets > 0 && availableTickets <= FINAL_TICKETS_EXCEPTION_MAX) {
    return 1;
  }

  return MIN_TICKETS_PER_PURCHASE;
}

export function getMinimumSelectableTickets(availableTickets?: number) {
  if (typeof availableTickets === "number" && availableTickets > 0 && availableTickets <= FINAL_TICKETS_EXCEPTION_MAX) {
    return 1;
  }

  return getDefaultTicketQuantity(availableTickets);
}

export function isTicketQuantityAllowed(quantity: number, availableTickets: number) {
  const normalizedQuantity = Math.trunc(quantity);
  const normalizedAvailableTickets = Math.trunc(availableTickets);

  if (normalizedQuantity <= 0 || normalizedAvailableTickets <= 0) return false;
  if (normalizedQuantity > normalizedAvailableTickets) return false;

  return (
    normalizedQuantity >= MIN_TICKETS_PER_PURCHASE ||
    (normalizedAvailableTickets <= FINAL_TICKETS_EXCEPTION_MAX && normalizedQuantity >= 1)
  );
}

export function getTicketQuantityError(quantity: number, availableTickets: number) {
  const normalizedQuantity = Math.trunc(quantity);
  const normalizedAvailableTickets = Math.trunc(availableTickets);

  if (normalizedAvailableTickets <= 0) {
    return "No hay boletos disponibles en este momento.";
  }

  if (normalizedQuantity > normalizedAvailableTickets) {
    return `Solo quedan ${normalizedAvailableTickets.toLocaleString("es-EC")} boletos disponibles.`;
  }

  if (isTicketQuantityAllowed(normalizedQuantity, normalizedAvailableTickets)) {
    return null;
  }

  return `La compra mínima es de ${MIN_TICKETS_PER_PURCHASE} boletos.`;
}

export function getNormalizedCheckoutQuantity(value: number, availableTickets?: number) {
  const normalizedValue = normalizeTicketQuantityInput(value);

  if (typeof availableTickets !== "number" || !Number.isFinite(availableTickets)) {
    return normalizedValue;
  }

  if (availableTickets <= 0) return 0;
  if (availableTickets <= FINAL_TICKETS_EXCEPTION_MAX) return Math.min(Math.max(1, normalizedValue), availableTickets);

  return Math.min(Math.max(MIN_TICKETS_PER_PURCHASE, normalizedValue), availableTickets);
}
