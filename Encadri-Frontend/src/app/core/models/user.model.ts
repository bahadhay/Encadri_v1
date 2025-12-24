export interface User {
  id: string;
  email: string;
  fullName: string;
  userRole: 'student' | 'supervisor' | 'admin';
  avatarUrl?: string;
  createdDate?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
