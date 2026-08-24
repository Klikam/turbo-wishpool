'use client';

import React, { createContext, type ReactNode, use, useState } from 'react';
import type { User } from '@/types/user';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  return (
    <UserContext value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext>
  );
};

export const useUserContext = () => {
  const context = use(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};
