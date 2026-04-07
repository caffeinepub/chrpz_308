// Re-export useActor from core-infrastructure with our backend's createActor pre-bound
import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { Backend } from "../backend";

export function useActor() {
  return _useActor<Backend>(createActor);
}
