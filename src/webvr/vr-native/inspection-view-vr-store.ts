"use client";

import { create } from "zustand";

type Rotation = { x: number; y: number };
type Offset = { x: number; z: number };

interface InspectionViewVrState {
  zoom: number;
  rotation: Rotation;
  offset: Offset;
  panMode: boolean;
  flowError: string | null;
  resetView: () => void;
  setZoom: (z: number | ((prev: number) => number)) => void;
  setRotation: (r: Rotation | ((prev: Rotation) => Rotation)) => void;
  setOffset: (o: Offset | ((prev: Offset) => Offset)) => void;
  setPanMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  setFlowError: (msg: string | null) => void;
}

const defaultRotation: Rotation = { x: 10, y: -20 };

export const useInspectionViewVrStore = create<InspectionViewVrState>((set) => ({
  zoom: 1.1,
  rotation: { ...defaultRotation },
  offset: { x: 0, z: 0 },
  panMode: false,
  flowError: null,
  resetView: () =>
    set({
      zoom: 1.1,
      rotation: { ...defaultRotation },
      offset: { x: 0, z: 0 },
      panMode: false,
      flowError: null
    }),
  setZoom: (z) => set((s) => ({ zoom: typeof z === "function" ? (z as (p: number) => number)(s.zoom) : z })),
  setRotation: (r) =>
    set((s) => ({
      rotation: typeof r === "function" ? (r as (p: Rotation) => Rotation)(s.rotation) : r
    })),
  setOffset: (o) =>
    set((s) => ({
      offset: typeof o === "function" ? (o as (p: Offset) => Offset)(s.offset) : o
    })),
  setPanMode: (v) => set((s) => ({ panMode: typeof v === "function" ? (v as (p: boolean) => boolean)(s.panMode) : v })),
  setFlowError: (flowError) => set({ flowError })
}));
