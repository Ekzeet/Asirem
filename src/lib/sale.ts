// Promotional pricing helpers. A sale is active when a lower sale price is set and (now) falls
// within its optional start/end window. The effective price is what the buyer is actually charged.
export function saleActive(priceCents: number, saleCents: number | null | undefined, startsAt?: string | null, endsAt?: string | null, now = Date.now()): boolean {
  return saleCents != null && saleCents < priceCents
    && (!startsAt || Date.parse(startsAt) <= now)
    && (!endsAt || Date.parse(endsAt) >= now)
}

export function effectivePrice(priceCents: number, saleCents: number | null | undefined, startsAt?: string | null, endsAt?: string | null, now = Date.now()): number {
  return saleActive(priceCents, saleCents, startsAt, endsAt, now) ? (saleCents as number) : priceCents
}
