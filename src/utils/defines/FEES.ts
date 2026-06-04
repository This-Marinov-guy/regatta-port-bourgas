// Registration fee charged per crew member, in euros.
// Change this value to adjust the price — everything downstream uses it.
export const FEE_PER_CREW_MEMBER_EUR = 20;

// Same fee expressed in cents (myPOS / payment amounts are handled in cents).
export const FEE_PER_CREW_MEMBER_CENTS = FEE_PER_CREW_MEMBER_EUR * 100;

// Total entry fee = the per-member fee multiplied by the number of crew members.
export function calculateTotalFeeCents(crewMemberCount: number): number {
  const members = Math.max(Math.floor(crewMemberCount), 1);
  return members * FEE_PER_CREW_MEMBER_CENTS;
}
