import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Vendor, Department, InventoryItem, Warehouse, Bank } from "@/types";

export function useVendors() {
  return useQuery<Vendor[]>({
    queryKey: ["master-data", "vendors"],
    queryFn: async () => {
      const res = await api.get("/api/master-data/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ["master-data", "departments"],
    queryFn: async () => {
      const res = await api.get("/api/master-data/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInventory() {
  return useQuery<InventoryItem[]>({
    queryKey: ["master-data", "inventory"],
    queryFn: async () => {
      const res = await api.get("/api/master-data/inventory");
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ["master-data", "warehouses"],
    queryFn: async () => {
      const res = await api.get("/api/master-data/warehouses");
      if (!res.ok) throw new Error("Failed to fetch warehouses");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBanks() {
  return useQuery<Bank[]>({
    queryKey: ["master-data", "banks"],
    queryFn: async () => {
      const res = await api.get("/api/master-data/banks");
      if (!res.ok) throw new Error("Failed to fetch banks");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
