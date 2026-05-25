import type { User } from "./schemas";

export const RECENT_NO_SHOW_MONTHS = 2;
export const RECENT_NO_SHOW_COLUMN = `No-Shows (Last ${RECENT_NO_SHOW_MONTHS} Months)`;

type CsvCell = string | number | null | undefined;

const ADMIN_USERS_EXPORT_HEADERS = [
  "Full Name",
  "Email",
  "Mobile",
  "Address",
  "Emergency Contact",
  "Emergency Contact Number",
  "Role",
  "Status",
  "Member Since",
  RECENT_NO_SHOW_COLUMN,
  "La Marea ID URL",
] as const;

export function countNoShowsInLastMonths(
  noShowDates: readonly string[],
  referenceDate: Date = new Date(),
  monthWindow = RECENT_NO_SHOW_MONTHS,
): number {
  const startDate = getMonthsAgoDate(referenceDate, monthWindow);
  const startDateKey = formatLocalDateKey(startDate);
  const endDateKey = formatLocalDateKey(referenceDate);

  return noShowDates.filter((date) => date >= startDateKey && date <= endDateKey).length;
}

export function buildAdminUsersCsvRows(
  users: readonly User[],
  referenceDate: Date = new Date(),
): { headers: string[]; rows: CsvCell[][] } {
  const rows = [...users]
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((u) => [
      u.fullName,
      u.email,
      u.mobile,
      u.address,
      u.emergencyContactName || "",
      u.emergencyContactNumber || "",
      u.role,
      u.isPaid ? "Active" : "Inactive",
      u.createdAt,
      countNoShowsInLastMonths(u.noShowDates, referenceDate),
      u.laMareaIdUrl || "",
    ]);

  return {
    headers: [...ADMIN_USERS_EXPORT_HEADERS],
    rows,
  };
}

export function buildAdminUsersCsvContent(
  users: readonly User[],
  referenceDate: Date = new Date(),
): string {
  const { headers, rows } = buildAdminUsersCsvRows(users, referenceDate);
  return stringifyCsvRows([headers, ...rows]);
}

function stringifyCsvRows(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map((row) => row.map(formatCsvCell).join(",")).join("\n");
}

function formatCsvCell(cell: CsvCell): string {
  return `"${String(cell ?? "").replace(/"/g, '""')}"`;
}

function getMonthsAgoDate(date: Date, months: number): Date {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() - months;
  const targetMonthLastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(date.getDate(), targetMonthLastDay));
}

function formatLocalDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
