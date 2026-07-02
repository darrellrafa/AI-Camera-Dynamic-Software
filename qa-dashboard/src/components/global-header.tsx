"use client";

import React from "react";
import { useRole, Role } from "@/context/rbac-context";
import {
  Camera,
  Shield,
  Search,
  Settings,
  ChevronDown,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function GlobalHeader() {
  const { role, setRole } = useRole();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-4 md:px-6">
        {/* Left — Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Camera className="h-5 w-5 text-emerald-400" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 pulse-glow" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight md:text-base">
              Camera AI
              <span className="text-muted-foreground font-normal"> — </span>
              <span className="text-emerald-400">Dynamic Software</span>
            </span>
            <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground md:block">
              AI Vision Quality Control Platform
            </span>
          </div>
        </div>

        {/* Center — Status */}
        <div className="hidden items-center gap-2 md:flex">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-muted-foreground">
            System Online — AI Engine Active
          </span>
        </div>

        {/* Right — Role Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger
              className="group flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/60 px-3 py-2 text-sm font-medium transition-all hover:border-emerald-500/30 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md ${
                  role === "ADMIN"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {role === "ADMIN" ? (
                  <Settings className="h-3.5 w-3.5" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
              </div>
              <span className="hidden sm:inline">{role}</span>
              <Shield
                className={`h-3.5 w-3.5 ${
                  role === "ADMIN" ? "text-amber-400" : "text-emerald-400"
                }`}
              />
              <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() => setRole("INSPECTOR")}
              className={`flex items-center gap-2 ${
                role === "INSPECTOR" ? "bg-emerald-500/10 text-emerald-400" : ""
              }`}
            >
              <Search className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">INSPECTOR</span>
                <span className="text-[10px] text-muted-foreground">
                  Quality Control Panel
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setRole("ADMIN")}
              className={`flex items-center gap-2 ${
                role === "ADMIN" ? "bg-amber-500/10 text-amber-400" : ""
              }`}
            >
              <Settings className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">ADMIN</span>
                <span className="text-[10px] text-muted-foreground">
                  System Configuration
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
