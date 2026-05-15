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
  "created_at",
];

const ADMIN_FILE_COLUMNS = ["payment_screenshot_url", "la_marea_id_url"];

export const MEMBER_USER_COLUMNS = BASE_USER_COLUMNS.join(",");
export const ADMIN_USER_COLUMNS = [...BASE_USER_COLUMNS, ...ADMIN_FILE_COLUMNS].join(",");
export const AUTH_USER_COLUMNS = MEMBER_USER_COLUMNS;

export const MONTHLY_PAYMENT_COLUMNS = "user_id,month,paid";
export const GAME_NO_SHOW_COLUMNS = "game_date,user_id";
export const GAME_DAY_COLUMNS = "date,is_cancelled,cancel_message,capacity_override";
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
