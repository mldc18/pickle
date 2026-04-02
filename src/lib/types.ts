export type UserRole = "member" | "admin";

export interface MonthlyPayment {
  month: string; // "2026-01"
  paid: boolean;
}

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  address: string;
  laMareaIdUrl: string;
  registrationFeeUrl: string;
  role: UserRole;
  isPaid: boolean;
  paymentHistory: MonthlyPayment[];
  noShowCount: number;
  acceptedTerms: boolean;
  createdAt: string;
}

export interface RegisteredPlayer {
  userId: string;
  fullName: string;
  registeredAt: string;
}

export interface GameDay {
  date: string; // "2026-04-03"
  isBlocked: boolean;
  blockMessage: string | null;
  registeredPlayers: RegisteredPlayer[];
  waitlist: RegisteredPlayer[];
  noShows: string[]; // userIds marked as no-show
}

export interface BlockedDate {
  date: string;
  message: string;
}

export interface RegistrationFormData {
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  email: string;
  mobile: string;
  address: string;
  laMareaId: File | null;
  acceptedTerms: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
