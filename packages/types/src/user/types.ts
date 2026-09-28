export interface User {
  id: number;
  name: string | null;
  email: string;
}

export interface UserWithPassword extends User {
  password: string;
}
