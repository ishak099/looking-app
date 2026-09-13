import pointersData from '../data/pointers.json';
import { Pointer, PointerQueueState } from '../types';

export const POINTERS: Pointer[] = pointersData.pointers;

const POINTERS_BY_ID: Record<string, Pointer> = Object.fromEntries(
  POINTERS.map((p) => [p.id, p])
);

export function getPointer(id: string): Pointer | undefined {
  return POINTERS_BY_ID[id];
}

function shuffledIds(avoidFirst?: string | null): string[] {
  const ids = POINTERS.map((p) => p.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  // Never repeat the pointer that closed out the previous walk of the queue.
  if (avoidFirst && ids.length > 1 && ids[0] === avoidFirst) {
    [ids[0], ids[1]] = [ids[1], ids[0]];
  }
  return ids;
}

/**
 * Draws the next pointer id from a persisted shuffle-walk queue, reshuffling
 * (without an immediate repeat) whenever the walk is exhausted. Returns the
 * drawn id plus the queue state to persist.
 */
export function drawNext(state: PointerQueueState | null): { id: string; next: PointerQueueState } {
  if (!state || state.cursor >= state.order.length) {
    const order = shuffledIds(state?.lastId ?? null);
    const id = order[0];
    return { id, next: { order, cursor: 1, lastId: id } };
  }
  const id = state.order[state.cursor];
  return { id, next: { order: state.order, cursor: state.cursor + 1, lastId: id } };
}

/** Draws `count` ids in a row, threading queue state through each draw. Used to
 * pre-schedule a batch of notifications from one persisted queue. */
export function drawBatch(
  state: PointerQueueState | null,
  count: number
): { ids: string[]; next: PointerQueueState } {
  let current = state;
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const { id, next } = drawNext(current);
    ids.push(id);
    current = next;
  }
  return { ids, next: current as PointerQueueState };
}
