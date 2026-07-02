"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Role = "ADMIN" | "INSPECTOR";

interface RBACContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("INSPECTOR");

  return (
    <RBACContext.Provider value={{ role, setRole }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRole must be used within a RBACProvider");
  }
  return context;
}
