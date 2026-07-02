"use client";

import React from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { Role } from "@/context/rbac-context";

interface LockedOverlayProps {
  requiredRole: Role;
  children: React.ReactNode;
}

export default function LockedOverlay({
  requiredRole,
  children,
}: LockedOverlayProps) {
  return (
    <div className="relative select-none">
      {/* Blurred content behind */}
      <div className="pointer-events-none blur-[6px] brightness-50 saturate-0 transition-all duration-500">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/30 bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 ring-2 ring-rose-500/20">
            <Lock className="h-7 w-7 text-rose-400" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold">Access Restricted</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Switch to{" "}
              <span className="font-semibold text-amber-400">
                {requiredRole}
              </span>{" "}
              role to access this panel
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">
              Requires {requiredRole} Privileges
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
