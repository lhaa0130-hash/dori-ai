import { relationshipFor } from "@/lib/myWorld/interaction/catalog";
import type { AIInteractionContext, InteractionEvent } from "@/lib/myWorld/interaction/types";

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
