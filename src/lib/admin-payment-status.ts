export type PaymentVerificationUser = {
  role: "member" | "admin" | "super_admin";
  paymentScreenshotUrl: string | null;
  paymentHistory: Array<{ month: string; paid: boolean }>;
};

export function getPendingPaymentVerificationUsers<T extends PaymentVerificationUser>(
  users: T[],
  month: string,
): T[] {
  return users.filter(
    (user) =>
      user.role === "member" &&
      !!user.paymentScreenshotUrl &&
      !user.paymentHistory.some((payment) => payment.month === month && payment.paid),
  );
}
