"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Cpu,
  Network,
  Gauge,
  Save,
  Package,
  Wrench,
  Server,
  Cable,
  CircuitBoard,
} from "lucide-react";

interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  targetSpecs: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

const INITIAL_PARTS: SparePart[] = [
  {
    id: "1",
    name: "Crankshaft",
    partNumber: "CRK-A100",
    targetSpecs: "Tolerance: ±0.02mm, Surface: Ra 0.4μm",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Gear Box",
    partNumber: "GBX-B200",
    targetSpecs: "Tolerance: ±0.05mm, Hardness: 58 HRC",
    status: "Active",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "Piston",
    partNumber: "PST-C300",
    targetSpecs: "Tolerance: ±0.01mm, Weight: 450g ±5g",
    status: "Active",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    name: "Camshaft",
    partNumber: "CMS-D400",
    targetSpecs: "Tolerance: ±0.03mm, Surface: Ra 0.8μm",
    status: "Inactive",
    createdAt: "2024-04-05",
  },
  {
    id: "5",
    name: "Flywheel",
    partNumber: "FLW-E500",
    targetSpecs: "Balance: ≤5g·cm, Runout: ≤0.05mm",
    status: "Active",
    createdAt: "2024-05-12",
  },
];

export default function AdminView() {
  const [parts, setParts] = useState<SparePart[]>(INITIAL_PARTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPartNumber, setFormPartNumber] = useState("");
  const [formTargetSpecs, setFormTargetSpecs] = useState("");
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState("");

  // AI Config state
  const [aiModel, setAiModel] = useState("anomalib");
  const [confidence, setConfidence] = useState([75]);
  const [plcProtocol, setPlcProtocol] = useState("profinet");

  // Load saved config
  useEffect(() => {
    const savedConf = localStorage.getItem("confidenceThreshold");
    if (savedConf) setConfidence([Number(savedConf)]);
    const savedModel = localStorage.getItem("aiModel");
    if (savedModel) setAiModel(savedModel);
  }, []);

  const handleSaveConfig = () => {
    localStorage.setItem("confidenceThreshold", confidence[0].toString());
    localStorage.setItem("aiModel", aiModel);
    alert("Configuration Saved Successfully!");
  };

  const openAddDialog = () => {
    setEditingPart(null);
    setFormName("");
    setFormPartNumber("");
    setFormTargetSpecs("");
    setDatasetFile(null);
    setTrainingStatus("");
    setDialogOpen(true);
  };

  const openEditDialog = (part: SparePart) => {
    setEditingPart(part);
    setFormName(part.name);
    setFormPartNumber(part.partNumber);
    setFormTargetSpecs(part.targetSpecs);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formPartNumber) return;

    if (editingPart) {
      setParts((prev) =>
        prev.map((p) =>
          p.id === editingPart.id
            ? { ...p, name: formName, partNumber: formPartNumber, targetSpecs: formTargetSpecs }
            : p
        )
      );
      setDialogOpen(false);
    } else {
      // If there's a dataset, train first
      if (datasetFile) {
        setIsTraining(true);
        setTrainingStatus("Uploading dataset and initializing training...");
        
        const formData = new FormData();
        formData.append("part_name", formName);
        formData.append("dataset", datasetFile);
        
        try {
          const res = await fetch("http://localhost:8000/api/train", {
            method: "POST",
            body: formData
          });
          
          if (res.ok) {
            setTrainingStatus("Training completed successfully!");
          } else {
            setTrainingStatus("Training failed.");
          }
        } catch (err) {
          setTrainingStatus("Error connecting to training server.");
        }
        
        setIsTraining(false);
      }
      
      const newPart: SparePart = {
        id: Date.now().toString(),
        name: formName,
        partNumber: formPartNumber,
        targetSpecs: formTargetSpecs,
        status: "Active",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setParts((prev) => [...prev, newPart]);
      setDialogOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
          <Settings className="h-6 w-6 text-amber-400" />
          ⚙️ System Configuration & Template Management
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage spare parts, AI models, and industrial connectivity
        </p>
      </div>

      {/* Part Management */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Package className="h-5 w-5 text-emerald-400" />
              Registered Spare Parts
              <Badge variant="outline" className="ml-2 text-[10px]">
                {parts.length} Total
              </Badge>
            </CardTitle>
            <Button
              onClick={openAddDialog}
              className="bg-emerald-600 font-semibold text-white shadow-lg shadow-emerald-500/15 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Spare Part
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Part Name
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Part Number
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Target Specifications
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((part) => (
                  <TableRow
                    key={part.id}
                    className="border-border/30 transition-colors hover:bg-secondary/30"
                  >
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs font-mono text-emerald-400">
                        {part.partNumber}
                      </code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[250px] truncate">
                      {part.targetSpecs}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          part.status === "Active"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-500/40 bg-zinc-500/10 text-zinc-400"
                        }`}
                      >
                        {part.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                      {part.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(part)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {deleteConfirmId === part.id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(part.id)}
                            className="h-8 px-2 text-[10px] font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                          >
                            Confirm?
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(part.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* AI Core Configurator */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Model Selection */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Cpu className="h-4 w-4 text-cyan-400" />
              AI Model Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Detection Model
              </Label>
              <Select value={aiModel} onValueChange={(v) => v && setAiModel(v)}>
                <SelectTrigger className="border-border/60 bg-secondary/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anomalib">
                    <div className="flex items-center gap-2">
                      <CircuitBoard className="h-3.5 w-3.5 text-blue-400" />
                      Anomalib (MVTec AD) — Industrial Standard
                    </div>
                  </SelectItem>
                  <SelectItem value="yolov8">
                    <div className="flex items-center gap-2">
                      <CircuitBoard className="h-3.5 w-3.5 text-emerald-400" />
                      YOLOv8 — Real-time Detection
                    </div>
                  </SelectItem>
                  <SelectItem value="yolov9">
                    <div className="flex items-center gap-2">
                      <CircuitBoard className="h-3.5 w-3.5 text-cyan-400" />
                      YOLOv9 — Enhanced Accuracy
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-border/30" />

            <div className="rounded-lg bg-secondary/30 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Model Status</span>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                  LOADED
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Inference Speed</span>
                <span className="font-mono text-emerald-400">~12ms</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">GPU Memory</span>
                <span className="font-mono text-amber-400">2.4 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Threshold */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Gauge className="h-4 w-4 text-amber-400" />
              Detection Threshold
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Confidence Threshold
                </Label>
                <span className="rounded-md bg-secondary/60 px-2 py-0.5 font-mono text-sm font-bold text-emerald-400">
                  {confidence[0]}%
                </span>
              </div>
              <Slider
                value={confidence}
                onValueChange={(v) => setConfidence(Array.isArray(v) ? [...v] : [v])}
                max={100}
                min={0}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0% — Loose</span>
                <span>50% — Balanced</span>
                <span>100% — Strict</span>
              </div>
            </div>

            <Separator className="bg-border/30" />

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Threshold Presets
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfidence([50])}
                  className="border-border/40 text-[10px] hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400"
                >
                  Loose
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfidence([75])}
                  className="border-border/40 text-[10px] hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                >
                  Balanced
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfidence([90])}
                  className="border-border/40 text-[10px] hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
                >
                  Strict
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PLC / Industrial Connectivity */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Network className="h-4 w-4 text-emerald-400" />
              PLC / Industrial Connectivity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Communication Protocol
              </Label>
              <Select value={plcProtocol} onValueChange={(v) => v && setPlcProtocol(v)}>
                <SelectTrigger className="border-border/60 bg-secondary/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profinet">
                    <div className="flex items-center gap-2">
                      <Server className="h-3.5 w-3.5 text-emerald-400" />
                      Profinet
                    </div>
                  </SelectItem>
                  <SelectItem value="modbus-tcp">
                    <div className="flex items-center gap-2">
                      <Cable className="h-3.5 w-3.5 text-cyan-400" />
                      Modbus TCP
                    </div>
                  </SelectItem>
                  <SelectItem value="digital-io">
                    <div className="flex items-center gap-2">
                      <CircuitBoard className="h-3.5 w-3.5 text-amber-400" />
                      Digital I/O
                    </div>
                  </SelectItem>
                  <SelectItem value="opcua">
                    <div className="flex items-center gap-2">
                      <Network className="h-3.5 w-3.5 text-purple-400" />
                      OPC-UA
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-border/30" />

            <div className="rounded-lg bg-secondary/30 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Connection</span>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                  CONNECTED
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">PLC Address</span>
                <span className="font-mono text-foreground/80">192.168.1.10</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-mono text-emerald-400">&lt;2ms</span>
              </div>
            </div>

            <Button
              className="w-full bg-amber-600 font-semibold text-white shadow-lg shadow-amber-500/15 transition-all hover:bg-amber-500 hover:shadow-amber-500/30"
              size="sm"
            >
              <Wrench className="mr-2 h-3.5 w-3.5" />
              Test Connection
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Config */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveConfig}
          className="bg-emerald-600 px-8 font-semibold text-white shadow-lg shadow-emerald-500/15 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30"
        >
          <Save className="mr-2 h-4 w-4" />
          Save All Configuration
        </Button>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border/40 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-400" />
              {editingPart ? "Edit Spare Part" : "Add New Spare Part"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingPart
                ? "Modify the spare part template details below."
                : "Create a new spare part template for AI inspection."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="part-name" className="text-xs">
                Part Name
              </Label>
              <Input
                id="part-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Crankshaft"
                className="border-border/60 bg-secondary/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="part-number" className="text-xs">
                Part Number
              </Label>
              <Input
                id="part-number"
                value={formPartNumber}
                onChange={(e) => setFormPartNumber(e.target.value)}
                placeholder="e.g., CRK-A100"
                className="border-border/60 bg-secondary/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-specs" className="text-xs">
                Target Specifications
              </Label>
              <Input
                id="target-specs"
                value={formTargetSpecs}
                onChange={(e) => setFormTargetSpecs(e.target.value)}
                placeholder="e.g., Tolerance: ±0.02mm, Surface: Ra 0.4μm"
                className="border-border/60 bg-secondary/60"
              />
            </div>
            
            {!editingPart && (
              <div className="space-y-2">
                <Label htmlFor="dataset-upload" className="text-xs">
                  Upload Normal Dataset (ZIP or Images)
                </Label>
                <Input
                  id="dataset-upload"
                  type="file"
                  accept=".zip, image/*"
                  multiple
                  onChange={(e) => setDatasetFile(e.target.files?.[0] || null)}
                  className="border-border/60 bg-secondary/60 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Upload normal (clean) photos to train the AI model for this new part.
                </p>
              </div>
            )}
            
            {trainingStatus && (
              <div className={`text-xs p-2 rounded ${trainingStatus.includes("failed") || trainingStatus.includes("Error") ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                {trainingStatus}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-border/40"
              disabled={isTraining}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formName || !formPartNumber || isTraining}
              className="bg-emerald-600 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {isTraining ? "Training..." : editingPart ? "Update Part" : "Add Part & Train"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="border-border/40 bg-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <Trash2 className="h-5 w-5" />
              Delete Spare Part
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this part? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="border-border/40"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-rose-600 font-semibold text-white hover:bg-rose-500"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
