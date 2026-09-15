import type { UserRole } from "@/types/auth";
import type { Pagination } from "@/types/reports";

export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  jobTitle: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  projectMemberships: Array<{
    project: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
}

export interface AdminUsersResponse {
  data: UserListItem[];
  pagination: Pagination;
}
