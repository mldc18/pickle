import { describe, expect, it } from "vitest";

import {
  getPendingPaymentVerificationUsers,
  type PaymentVerificationUser,
} from "./admin-payment-status";

type TestPaymentUser = PaymentVerificationUser & { id: string };

describe("admin payment status helpers", () => {
  it("finds members unpaid for the viewed month even when another month is active", () => {
    const users: TestPaymentUser[] = [
      {
        id: "user-1",
        role: "member",
        paymentScreenshotUrl: "proof.jpg",
        paymentHistory: [
          { month: "2026-04", paid: false },
          { month: "2026-05", paid: true },
        ],
      },
      {
        id: "user-2",
        role: "member",
        paymentScreenshotUrl: "proof.jpg",
        paymentHistory: [
          { month: "2026-04", paid: true },
          { month: "2026-05", paid: false },
        ],
      },
    ];

    expect(getPendingPaymentVerificationUsers(users, "2026-04").map((u) => u.id)).toEqual([
      "user-1",
    ]);
  });

  it("does not include admins or users without payment proof", () => {
    const users: TestPaymentUser[] = [
      {
        id: "admin-1",
        role: "super_admin",
        paymentScreenshotUrl: "proof.jpg",
        paymentHistory: [{ month: "2026-04", paid: false }],
      },
      {
        id: "user-1",
        role: "member",
        paymentScreenshotUrl: null,
        paymentHistory: [{ month: "2026-04", paid: false }],
      },
    ];

    expect(getPendingPaymentVerificationUsers(users, "2026-04")).toEqual([]);
  });
});
