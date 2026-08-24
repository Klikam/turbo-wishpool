import { authClient } from '../lib/auth-client';
import type { Credentials } from '../types/credentials';

export const register = async (credentials: Credentials) =>
  authClient.signUp.email({
    name: credentials.name,
    email: credentials.email,
    password: credentials.password,
  });

export const login = async (credentials: Omit<Credentials, 'name'>) =>
  authClient.signIn.email({
    email: credentials.email,
    password: credentials.password,
  });
