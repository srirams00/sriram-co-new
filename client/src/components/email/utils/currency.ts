export function formatINR(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}
