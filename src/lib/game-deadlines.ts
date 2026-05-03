import {
  CANCELLATION_CLOSE_HOUR,
  CANCELLATION_CLOSE_MINUTE,
  REGISTRATION_CLOSE_HOUR,
  REGISTRATION_CLOSE_MINUTE,
} from "@/lib/constants";

const MANILA_TIME_ZONE = "Asia/Manila";

function to24HourTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getMinutesFrom24Hour(timeValue: string) {
  const [hour, minute] = timeValue.split(":").map(Number);
  return hour * 60 + minute;
}

function getManilaMinutes(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return hour * 60 + minute;
}

function formatTimeLabel(timeValue: string) {
  const [rawHour, rawMinute] = timeValue.split(":").map(Number);
  const suffix = rawHour >= 12 ? "PM" : "AM";
  const hour = rawHour % 12 || 12;
  const minute = String(rawMinute).padStart(2, "0");
  return `${hour}:${minute} ${suffix}`;
}

export const CANCELLATION_DEADLINE = to24HourTime(
  CANCELLATION_CLOSE_HOUR,
  CANCELLATION_CLOSE_MINUTE,
);
export const REGISTRATION_DEADLINE = to24HourTime(
  REGISTRATION_CLOSE_HOUR,
  REGISTRATION_CLOSE_MINUTE,
);

export const CANCELLATION_DEADLINE_LABEL = formatTimeLabel(CANCELLATION_DEADLINE);
export const REGISTRATION_DEADLINE_LABEL = formatTimeLabel(REGISTRATION_DEADLINE);

export function isBeforeCancellationDeadline(now: Date = new Date()) {
  return getManilaMinutes(now) < getMinutesFrom24Hour(CANCELLATION_DEADLINE);
}

export function isBeforeRegistrationDeadline(now: Date = new Date()) {
  return getManilaMinutes(now) < getMinutesFrom24Hour(REGISTRATION_DEADLINE);
}
