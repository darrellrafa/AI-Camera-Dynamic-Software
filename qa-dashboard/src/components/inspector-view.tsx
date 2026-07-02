"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Square,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  BarChart3,
  Eye,
  Zap,
  Clock,
  Box,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const PARTS = [
  { id: "crankshaft", name: "Crankshaft", code: "CRK-A100" },
  { id: "gearbox", name: "Gear Box", code: "GBX-B200" },
  { id: "piston", name: "Piston", code: "PST-C300" },
  { id: "camshaft", name: "Camshaft", code: "CMS-D400" },
  { id: "flywheel", name: "Flywheel", code: "FLW-E500" },
];

interface DefectStatus {
  name: string;
  detected: boolean;
  confidence: number;
}

const DEFECT_CHART_DATA = [
  { name: "Scratch", count: 12, color: "#f43f5e" },
  { name: "Crack", count: 3, color: "#f59e0b" },
  { name: "Dent", count: 7, color: "#06b6d4" },
  { name: "Rust", count: 2, color: "#8b5cf6" },
];

export default function InspectorView() {
  const [selectedPart, setSelectedPart] = useState("crankshaft");
  const [isRunning, setIsRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [partsProcessed, setPartsProcessed] = useState(247);
  const [rejectRate, setRejectRate] = useState(4.8);
  const [elapsed, setElapsed] = useState(0);
  const [defects, setDefects] = useState<DefectStatus[]>([
    { name: "Scratch", detected: true, confidence: 94.2 },
    { name: "Crack", detected: false, confidence: 0 },
    { name: "Dent", detected: false, confidence: 0 },
    { name: "Rust", detected: false, confidence: 0 },
  ]);

  // Simulate live updates when QC is running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
      // Every 5 seconds, simulate a new part processed
      if (Math.random() > 0.7) {
        setPartsProcessed((prev) => prev + 1);
        setRejectRate((prev) => Math.max(0, Math.min(15, prev + (Math.random() - 0.55) * 0.3)));
        // Randomly toggle defects
        setDefects([
          {
            name: "Scratch",
            detected: Math.random() > 0.4,
            confidence: 85 + Math.random() * 14,
          },
          {
            name: "Crack",
            detected: Math.random() > 0.85,
            confidence: 70 + Math.random() * 25,
          },
          {
            name: "Dent",
            detected: Math.random() > 0.75,
            confidence: 80 + Math.random() * 18,
          },
          {
            name: "Rust",
            detected: Math.random() > 0.9,
            confidence: 60 + Math.random() * 35,
          },
        ]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle Webcam connection
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isRunning) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
          stream = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error("Error accessing webcam:", err);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRunning]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    setElapsed(0);
  }, []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const detectedCount = defects.filter((d) => d.detected).length;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
            <Eye className="h-6 w-6 text-emerald-400" />
            🔍 Daily Quality Control (QC) Panel
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time AI vision defect detection — Shift inspection management
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Part Selector */}
          <Select value={selectedPart} onValueChange={(v) => v && setSelectedPart(v)}>
            <SelectTrigger className="w-[200px] border-border/60 bg-secondary/60">
              <Box className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select Part" />
            </SelectTrigger>
            <SelectContent>
              {PARTS.map((part) => (
                <SelectItem key={part.id} value={part.id}>
                  <span className="font-medium">{part.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({part.code})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Control Buttons */}
          <Button
            onClick={handleStart}
            disabled={isRunning}
            className="bg-emerald-600 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/40 disabled:opacity-50"
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            QC START
          </Button>
          <Button
            onClick={handleStop}
            disabled={!isRunning}
            variant="destructive"
            className="bg-rose-600 px-6 font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-500 hover:shadow-rose-500/40 disabled:opacity-50"
            size="lg"
          >
            <Square className="mr-2 h-4 w-4" />
            STOP
          </Button>
        </div>
      </div>

      {/* Status Strip */}
      {isRunning && (
        <div className="flex items-center gap-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-glow" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              QC Running
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(elapsed)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cpu className="h-3 w-3" />
            YOLOv8 — 98.2% Uptime
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
            LIVE
          </Badge>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Camera Feed */}
        <Card className="overflow-hidden border-border/40 bg-card/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="h-4 w-4 text-amber-400" />
                Live Camera Feed — AI Detection Overlay
              </CardTitle>
              {isRunning && (
                <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse">
                  ● REC
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-900/80 grid-pattern">
              {/* Webcam feed */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isRunning ? 'opacity-100' : 'opacity-0'}`} 
              />

              {/* Simulated camera feed — dark background with part silhouette */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isRunning ? 'opacity-0' : 'opacity-100'}`}>
                {/* Part silhouette */}
                <svg
                  viewBox="0 0 400 280"
                  className="h-full w-full max-w-lg opacity-80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Crankshaft shape */}
                  <rect x="50" y="110" width="300" height="60" rx="10" fill="#2a2d35" stroke="#3f4451" strokeWidth="1.5" />
                  <circle cx="100" cy="140" r="35" fill="#2a2d35" stroke="#3f4451" strokeWidth="1.5" />
                  <circle cx="200" cy="140" r="30" fill="#2a2d35" stroke="#3f4451" strokeWidth="1.5" />
                  <circle cx="300" cy="140" r="35" fill="#2a2d35" stroke="#3f4451" strokeWidth="1.5" />
                  <rect x="85" y="70" width="30" height="60" rx="5" fill="#2a2d35" stroke="#3f4451" strokeWidth="1" />
                  <rect x="185" y="80" width="30" height="50" rx="5" fill="#2a2d35" stroke="#3f4451" strokeWidth="1" />
                  <rect x="285" y="70" width="30" height="60" rx="5" fill="#2a2d35" stroke="#3f4451" strokeWidth="1" />
                  <rect x="85" y="170" width="30" height="60" rx="5" fill="#2a2d35" stroke="#3f4451" strokeWidth="1" />
                  <rect x="185" y="175" width="30" height="50" rx="5" fill="#2a2d35" stroke="#3f4451" strokeWidth="1" />
                  <rect x="285" y="170" width="30" height="60" rx="5" fill="#2a2d35" stroke="#3f4451" strokeWidth="1" />
                </svg>
              </div>

              {/* Bounding boxes overlay — only show when running */}
              {isRunning && (
                <>
                  {defects[0].detected && (
                    <div className="absolute left-[18%] top-[28%] h-[22%] w-[16%] rounded border-2 border-orange-500 bg-orange-500/10 transition-all duration-500">
                      <span className="absolute -top-5 left-0 rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">
                        SCRATCH {defects[0].confidence.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {defects[1].detected && (
                    <div className="absolute left-[55%] top-[35%] h-[18%] w-[12%] rounded border-2 border-rose-500 bg-rose-500/10 transition-all duration-500">
                      <span className="absolute -top-5 left-0 rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">
                        CRACK {defects[1].confidence.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {defects[2].detected && (
                    <div className="absolute left-[68%] top-[50%] h-[16%] w-[14%] rounded border-2 border-cyan-500 bg-cyan-500/10 transition-all duration-500">
                      <span className="absolute -top-5 left-0 rounded bg-cyan-500 px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">
                        DENT {defects[2].confidence.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {defects[3].detected && (
                    <div className="absolute left-[32%] top-[58%] h-[20%] w-[15%] rounded border-2 border-purple-500 bg-purple-500/10 transition-all duration-500">
                      <span className="absolute -top-5 left-0 rounded bg-purple-500 px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">
                        RUST {defects[3].confidence.toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* Scan line */}
                  <div className="scanline absolute left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                </>
              )}

              {/* Idle overlay */}
              {!isRunning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px]">
                  <div className="rounded-full border border-border/30 bg-secondary/50 p-4">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Press QC START to begin inspection
                  </p>
                </div>
              )}

              {/* Corner indicators */}
              <div className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-emerald-500/50" />
              <div className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-emerald-500/50" />
              <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-emerald-500/50" />
              <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-emerald-500/50" />

              {/* Timestamp */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono text-emerald-400/80">
                CAM-01 | {isRunning ? formatTime(elapsed) : "STANDBY"} | {PARTS.find(p => p.id === selectedPart)?.code}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Detection Checklist Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="border-border/40 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Cpu className="h-4 w-4 text-cyan-400" />
                AI Detection Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {defects.map((defect) => (
                <div
                  key={defect.name}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all ${
                    defect.detected
                      ? "border-rose-500/30 bg-rose-500/5"
                      : "border-emerald-500/15 bg-emerald-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {defect.detected ? (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                    <span className="text-sm font-medium">{defect.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      defect.detected
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {defect.detected
                      ? `DETECTED ${defect.confidence.toFixed(0)}%`
                      : "SAFE"}
                  </Badge>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-3 rounded-lg bg-secondary/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Verdict
                  </span>
                  <Badge
                    className={`${
                      detectedCount > 0
                        ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {detectedCount > 0 ? (
                      <>
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        REJECT — {detectedCount} Defect{detectedCount > 1 ? "s" : ""}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        PASS
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card className="border-border/40 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-amber-400" />
                Shift Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-secondary/40 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Parts Processed
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-400">
                    {partsProcessed}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Reject Rate
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${rejectRate > 5 ? "text-rose-400" : "text-emerald-400"}`}>
                    {rejectRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Metrics Footer — Defect Breakdown Chart */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Defect Breakdown — Current Shift
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={DEFECT_CHART_DATA}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c1f26",
                    border: "1px solid #2e3138",
                    borderRadius: "8px",
                    color: "#f4f4f5",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={48}>
                  {DEFECT_CHART_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
