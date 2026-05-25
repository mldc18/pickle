export function canTogglePaymentMonth(
  month: string,
  currentMonth: string,
  isSuperAdmin: boolean,
): boolean {
  return month <= currentMonth || isSuperAdmin;
}
