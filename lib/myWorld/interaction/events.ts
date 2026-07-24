// 상대 경로 import — node:test 에서 별칭 없이 직접 로드할 수 있도록 유지한다.
import { relationshipFor } from "./catalog.ts";
import type { AIInteractionContext, InteractionEvent } from "./types.ts";

export const MY_WORLD_INTERACTION_EVENT = "my-world:interaction";

type Listener = (context: AIInteractionContext) => void;
const listeners = new Set<Listener>();

export function subscribeToInteraction(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Publishes to local subscribers and the DOM for missions, analytics and future AI prompts. */
export function publishInteraction(event: InteractionEvent, affinity: number): AIInteractionContext {
  const detail: AIInteractionContext = { event, affinity, emotion: event.emotion, relationship: relationshipFor(affinity) };
  listeners.forEach((listener) => listener(detail));
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(MY_WORLD_INTERACTION_EVENT, { detail }));
  return detail;
}
