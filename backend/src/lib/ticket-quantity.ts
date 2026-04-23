export const MIN_TICKETS_PER_PURCHASE = 3
export const FINAL_TICKETS_EXCEPTION_MAX = 2

export function isTicketQuantityAllowed(quantity: number, availableTickets: number) {
  const normalizedQuantity = Math.trunc(quantity)
  const normalizedAvailableTickets = Math.trunc(availableTickets)

  if (normalizedQuantity <= 0 || normalizedAvailableTickets <= 0) return false
  if (normalizedQuantity > normalizedAvailableTickets) return false

  return (
    normalizedQuantity >= MIN_TICKETS_PER_PURCHASE ||
    (normalizedAvailableTickets <= FINAL_TICKETS_EXCEPTION_MAX && normalizedQuantity >= 1)
  )
}

export function getTicketQuantityValidationError(quantity: number, availableTickets: number) {
  const normalizedQuantity = Math.trunc(quantity)
  const normalizedAvailableTickets = Math.trunc(availableTickets)

  if (normalizedAvailableTickets <= 0) {
    return 'No hay boletos disponibles en este momento.'
  }

  if (normalizedQuantity > normalizedAvailableTickets) {
    return `No hay suficientes boletos disponibles. Solo quedan ${normalizedAvailableTickets} boletos.`
  }

  if (isTicketQuantityAllowed(normalizedQuantity, normalizedAvailableTickets)) {
    return null
  }

  return `La compra mínima es de ${MIN_TICKETS_PER_PURCHASE} boletos.`
}
