const BASE_USER_COLUMNS = [
  "id",
  "username",
  "full_name",
  "first_name",
  "last_name",
  "email",
  "mobile",
  "address",
  "role",
  "avatar_url",
  "photo_url",
  "emergency_contact_name",
  "emergency_contact_number",
  "accepted_terms",
  "accepted_rules",
  "must_change_password",
  "created_at",
];

const ADMIN_FILE_COLUMNS = ["payment_screenshot_url", "la_marea_id_url"];

export const MEMBER_USER_COLUMNS = BASE_USER_COLUMNS.join(",");
export const ADMIN_USER_COLUMNS = [...BASE_USER_COLUMNS, ...ADMIN_FILE_COLUMNS].join(",");
export const AUTH_USER_COLUMNS = MEMBER_USER_COLUMNS;
export const ROSTER_USER_COLUMNS = "id,full_name,avatar_url,photo_url";

export const MONTHLY_PAYMENT_COLUMNS = "user_id,month,paid";
export const GAME_NO_SHOW_COLUMNS = "game_date,user_id";
export const GAME_DAY_COLUMNS = "date,is_cancelled,cancel_message,capacity_override,capacity_snapshot";
export const GAME_REGISTRATION_COLUMNS = "game_date,user_id,status,position,registered_at";

type AppDataQueryScopeInput = {
  isAdmin: boolean;
  userId: string | null | undefined;
};

export type AppDataQueryScope = {
  userColumns: string;
  paymentUserId: string | null;
  noShowUserId: string | null;
};

export type GameDataQueryScope = {
  gameDate: string | null;
};

type RegistrationIdentity = {
  game_date: string;
  user_id: string;
};

export function getAppDataQueryScope({
  isAdmin,
  userId,
}: AppDataQueryScopeInput): AppDataQueryScope {
  if (isAdmin) {
    return {
      userColumns: ADMIN_USER_COLUMNS,
      paymentUserId: null,
      noShowUserId: null,
    };
  }

  const memberUserId = userId ?? null;
  return {
    userColumns: MEMBER_USER_COLUMNS,
    paymentUserId: memberUserId,
    noShowUserId: memberUserId,
  };
}

export function getRosterUserIdsForQuery({
  isAdmin,
  today,
  registrations,
}: {
  isAdmin: boolean;
  today: string;
  registrations: RegistrationIdentity[];
}): string[] {
  const ids = new Set<string>();
  for (const registration of registrations) {
    if (isAdmin || registration.game_date === today) {
      ids.add(registration.user_id);
    }
  }
  return [...ids];
}

export function getGameDataQueryScope({
  isAdmin,
  pathname,
  today,
}: {
  isAdmin: boolean;
  pathname: string;
  today: string;
}): GameDataQueryScope {
  if (isAdmin || pathname === "/calendar") {
    return { gameDate: null };
  }
  return { gameDate: today };
}
