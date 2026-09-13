import { PointerLine } from '../types';

const BASE_MS = 1500;
const PER_CHAR_MS = 62;

/** Milliseconds to hold a line on screen before advancing. Ported 1:1 from the prototype. */
export function pauseFor(line: PointerLine, reducedMotion: boolean): number {
  const read = BASE_MS + line.t.length * PER_CHAR_MS;
  const held = read * (line.hold ?? 1);
  return reducedMotion ? held * 0.85 : held;
}
