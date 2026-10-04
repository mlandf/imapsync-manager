"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ProfileInput } from "@/types/api";

export const profileKeys = { all: ["profiles"] as const };

export function useProfiles() {
  return useQuery({ queryKey: profileKeys.all, queryFn: api.listProfiles });
}

export function useSaveProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ProfileInput }) =>
      id ? api.updateProfile(id, data) : api.createProfile(data),
    onSuccess: () => client.invalidateQueries({ queryKey: profileKeys.all }),
  });
}

export function useDeleteProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProfile,
    onSuccess: () => client.invalidateQueries({ queryKey: profileKeys.all }),
  });
}
