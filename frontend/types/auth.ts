export type UserRole = "TEAM_MEMBER" | "MANAGER" | "ADMIN";

export interface AuthenticatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  jobTitle: string | null;
}
