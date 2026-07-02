"use client";

import React from "react";
import { RBACProvider, useRole } from "@/context/rbac-context";
import GlobalHeader from "@/components/global-header";
import InspectorView from "@/components/inspector-view";
import AdminView from "@/components/admin-view";
import LockedOverlay from "@/components/locked-overlay";
import { Separator } from "@/components/ui/separator";

function DashboardContent() {
  const { role } = useRole();

  return (
    <div className="flex min-h-screen flex-col bg-background grid-pattern">
      <GlobalHeader />

      <main className="mx-auto w-full max-w-[1920px] flex-1">
        {/* Inspector Panel */}
        <InspectorView />

        <Separator className="bg-border/20" />

        {/* Admin Panel */}
        {role === "ADMIN" ? (
          <AdminView />
        ) : (
          <LockedOverlay requiredRole="ADMIN">
            <AdminView />
          </LockedOverlay>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between px-4 py-3 md:px-6">
          <p className="text-[10px] text-muted-foreground">
            © 2024 Camera AI — Dynamic Software. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>v2.4.1</span>
            <span>·</span>
            <span>AI Engine: YOLOv8</span>
            <span>·</span>
            <span className="text-emerald-400">● Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <RBACProvider>
      <DashboardContent />
    </RBACProvider>
  );
}
