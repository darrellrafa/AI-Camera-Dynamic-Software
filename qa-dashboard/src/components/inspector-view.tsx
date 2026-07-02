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
  Upload,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [liveDefects, setLiveDefects] = useState<any[]>([]);
  const [partsProcessed, setPartsProcessed] = useState(247);
  const [rejectRate, setRejectRate] = useState(4.8);
  const [elapsed, setElapsed] = useState(0);
  const [defects, setDefects] = useState<DefectStatus[]>([
    { name: "Scratch", detected: true, confidence: 94.2 },
    { name: "Crack", detected: false, confidence: 0 },
    { name: "Dent", detected: false, confidence: 0 },
    { name: "Rust", detected: false, confidence: 0 },
  ]);

  // Capture frame and send to FastAPI backend
  useEffect(() => {
    if (!isRunning) {
      return;
    }
    
    const captureAndDetect = async () => {
      setElapsed((prev) => prev + 1);
      
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            
            const formData = new FormData();
            formData.append("file", blob, "frame.jpg");
            
            try {
              // Call FastAPI backend
              const res = await fetch("http://localhost:8000/api/detect", {
                method: "POST",
                body: formData,
              });
              
              if (res.ok) {
                const result = await res.json();
                if (result.success) {
                  const newDefects = result.data.defects;
                  setLiveDefects(newDefects);
                  
                  // Update sidebar defects state
                  setDefects((prevDefects) => {
                     return prevDefects.map(d => {
                        const found = newDefects.find((nd: any) => nd.name.toLowerCase() === d.name.toLowerCase());
                        if (found) {
                           return { ...d, detected: true, confidence: found.confidence };
                        }
                        return { ...d, detected: false, confidence: 0 };
                     });
                  });
                  
                  if (result.data.is_defective) {
                     setRejectRate((prev) => Math.max(0, Math.min(15, prev + 0.1)));
                  }
                }
              }
            } catch (err) {
              console.error("API error:", err);
            }
          }, "image/jpeg", 0.8);
        }
      }
    };
    
    // Simulate part process counting
    const metricsInterval = setInterval(() => {
        if (Math.random() > 0.7) setPartsProcessed((prev) => prev + 1);
    }, 5000);

    const interval = setInterval(captureAndDetect, 1000); // 1 FPS inference
    return () => {
       clearInterval(interval);
       clearInterval(metricsInterval);
    }
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
    setUploadedImage(null);
    setLiveDefects([]);
    setElapsed(0);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show image immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Stop webcam if running
    setIsRunning(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/detect", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          const newDefects = result.data.defects;
          setLiveDefects(newDefects);

          setDefects((prevDefects) => {
             return prevDefects.map(d => {
                const found = newDefects.find((nd: any) => nd.name.toLowerCase() === d.name.toLowerCase());
                if (found) {
                   return { ...d, detected: true, confidence: found.confidence };
                }
                return { ...d, detected: false, confidence: 0 };
             });
          });

          if (result.data.is_defective) {
             setRejectRate((prev) => Math.max(0, Math.min(15, prev + 0.1)));
          }
          setPartsProcessed((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error("API error:", err);
    }
  };

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setLiveDefects([]);
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
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-border/60 bg-secondary/60 hover:bg-secondary/80"
          >
            <Upload className="mr-2 h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">PHOTO</span>
          </Button>
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
      {(isRunning || uploadedImage) && (
        <div className="flex items-center gap-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full bg-emerald-500 ${isRunning ? "pulse-glow" : ""}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {isRunning ? "QC Running" : "Photo Analyzed"}
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
            {isRunning ? "LIVE" : "STATIC"}
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
              {uploadedImage && !isRunning && (
                <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30">
                  PHOTO
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
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isRunning && !uploadedImage ? 'opacity-100' : 'opacity-0'}`} 
              />
              
              {/* Uploaded Photo */}
              {uploadedImage && (
                <img 
                  src={uploadedImage} 
                  alt="Uploaded QC" 
                  className="absolute inset-0 h-full w-full object-cover bg-black"
                />
              )}
              
              {/* Hidden Canvas for capturing frames */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Simulated camera feed — dark background with part silhouette */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isRunning || uploadedImage ? 'opacity-0' : 'opacity-100'}`}>
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
              {(isRunning || uploadedImage) && (
                <>
                  {liveDefects.map((defect: any, idx: number) => {
                    const getBoxStyle = (name: string) => {
                      switch(name) {
                        case "Scratch": return "border-orange-500 bg-orange-500/10";
                        case "Crack": return "border-rose-500 bg-rose-500/10";
                        case "Dent": return "border-cyan-500 bg-cyan-500/10";
                        case "Rust": return "border-purple-500 bg-purple-500/10";
                        default: return "border-rose-500 bg-rose-500/10";
                      }
                    };
                    const getLabelStyle = (name: string) => {
                      switch(name) {
                        case "Scratch": return "bg-orange-500";
                        case "Crack": return "bg-rose-500";
                        case "Dent": return "bg-cyan-500";
                        case "Rust": return "bg-purple-500";
                        default: return "bg-rose-500";
                      }
                    };
                    
                    return (
                      <div
                        key={idx}
                        className={`absolute rounded border-2 transition-all duration-300 ${getBoxStyle(defect.name)}`}
                        style={{
                          left: `${defect.box.x * 100}%`,
                          top: `${defect.box.y * 100}%`,
                          width: `${defect.box.w * 100}%`,
                          height: `${defect.box.h * 100}%`,
                        }}
                      >
                        <span className={`absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap ${getLabelStyle(defect.name)}`}>
                          {defect.name.toUpperCase()} {defect.confidence.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}

                  {/* Scan line (only when live) */}
                  {isRunning && (
                    <div className="scanline absolute left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                  )}
                </>
              )}

              {/* Idle overlay */}
              {!isRunning && !uploadedImage && (
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
                CAM-01 | {isRunning ? formatTime(elapsed) : uploadedImage ? "PHOTO ANALYZED" : "STANDBY"} | {PARTS.find(p => p.id === selectedPart)?.code}
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
