# Looking

A mobile self-inquiry app. One short pointer at a time, revealed line by line,
at unpredictable moments. Built with Expo + React Native + TypeScript per
`looking-app-spec.md`.

**Web preview (not the shipping target — see below):**
https://ishak099.github.io/looking-app/

## Run it

```bash
npm install
npm run android   # or: npm run ios / npm run web
```

`npm run web` is a fast way to sanity-check UI/logic changes in a browser, but
web is not a shipping target — verify real behavior (pacing, reduced motion,
and especially notifications) on a physical iOS/Android device. Simulators
can't reproduce killed-app notification delivery.

## Build & install on a phone

Linked to the `@ishak099/looking-app` project on expo.dev (`app.json`'s
`extra.eas.projectId`). To get a real installable build on an Android phone:

```bash
npx eas-cli build --platform android --profile preview
```

This produces a standalone APK (no Expo Go needed) and prints an
expo.dev link + QR code — open it on the phone (allow installs from
unknown sources) to install directly. A fresh build takes roughly the ~5-10
minutes queue + build time; check status any time with
`npx eas-cli build:list --limit 5`.

iOS is not set up — it needs an Apple Developer Program membership ($99/yr)
before any build can install on a physical device outside Expo Go.

## What's implemented

- All four screens (Opening, Looking, After/resting, Settings), matching the
  spec's layout, palette (`#1E2A2C` / `#E8E2D6` / `#8A9694`), and serif type.
- The exact pacing formula from the prototype (`src/lib/pacing.ts`), including
  the 0.85x reduced-motion multiplier and per-line `hold` overrides.
- Tap-to-advance that never skips a line, no progress indicator, no chrome.
- A quiet pause after every pointer (`src/screens/AfterScreen.tsx`): the
  screen holds blank for ~5s before "Look at another" fades in, same
  pacing philosophy as the lines themselves, applied to the gap between
  pointers. No countdown, no message — just friction against turning the
  app into a scrolling feed instead of one thing to sit with.
- On-device only: no backend, no accounts, no analytics. AsyncStorage holds
  exactly what the spec allows — notification settings, the shuffle-walk
  queue position, and a small counter used only to time the permission ask
  (`src/lib/storage.ts`).
- Local notifications (`src/lib/notifications.ts`): permission requested only
  after the third completed pointer, a single low-importance Android channel,
  a rolling ~30-notification window topped up on every app open, ±90 minute
  jitter inside the user's waking window, and no `SCHEDULE_EXACT_ALARM`
  request. Tapping a notification opens straight into that pointer via
  `getLastNotificationResponseAsync` (cold start) and
  `addNotificationResponseReceivedListener` (warm).
- One shared shuffle-walk queue (`storage.getPointerQueue`/`setPointerQueue`)
  for every draw — in-app taps and scheduled notifications alike — so no
  pointer repeats until all 1,404 have been shown once, regardless of which
  surface showed them, without the app tracking or surfacing any view
  history.

## Web hosting

`.github/workflows/deploy-web.yml` runs `expo export --platform web` and
publishes `dist/` to GitHub Pages on every push to `master`. This is a
**preview for looking at the UI in a browser** — notifications, and true
device pacing feel, only exist on iOS/Android. `app.json`'s
`expo.experiments.baseUrl` is hardcoded to `/looking-app` to match this
repo's Pages path; update it if the repo is ever renamed or moved.

## Content

`src/data/pointers.json` holds 1,404 pointers: the 14 seed pointers from the
spec, verbatim, plus 1,390 more written to the same voice rules (spec §9) —
verbs not nouns, no banned vocabulary (awareness, consciousness, presence,
the witness, energy, journey, and the rest of the list), concrete triggers
drawn from the body, senses, emotion, waiting, memory, work, relationships,
boundary/connectedness, and the practice itself, questions left open, no
promises. Spanning 165 distinct themes so the shuffle-walk queue
(`src/lib/queue.ts`) has real variety before it repeats.

About 470 of these draw on the same territory Krishnamurti-style self-
inquiry covers — conditioning, the image carried of a person versus who's
actually there, psychological security, the observed/observer split (never
named that way — "observer" is banned vocabulary, so it's rendered as "the
one feeling it" or "something watches"), thought as always old, the gap
between a stimulus and a reaction. No teacher or tradition is ever named in
the pointer text itself; the spec's own anti-doctrine rule ("the app
asserts nothing") applies to this material exactly as much as to the
original 14.

`scripts/validate-pointers.mjs` (`node scripts/validate-pointers.mjs`) checks
every pointer for banned vocabulary (word-boundary matched, so "negotiated"
doesn't trip on the banned word "ego"), duplicate ids, duplicate opening
lines, line-count bounds (3-6), and sane `hold` values. Run it after editing
`pointers.json` — it's the mechanical half of the voice-rule check; the
other half (does it actually read like a pointer, not an assertion, and
does it accidentally repeat an existing pointer's scenario under a new id)
still needs a human pass. Some structural repetition across pointers is by
design in this genre (a handful of closing questions like "By what?" recur,
the same way they do in the original 14) — that's not a bug the validator
should chase.

## Known gaps before this should ship to a store

1. **App icon / splash / Android notification icon.** Placeholder Expo
   template assets are still in `assets/`. Needs real 1024x1024 icon art
   before a store submission.
2. **EAS project — Android done, iOS not started.** Linked to
   `@ishak099/looking-app` on expo.dev; `eas build --platform android
   --profile preview` produces an installable APK (`eas.json`'s `preview`
   profile). iOS needs an Apple Developer Program membership ($99/yr) plus
   `eas device:create` to register a test device before a build can install
   outside Expo Go — not set up yet.
3. **Two-week dogfood + TestFlight/internal track**, per the spec's build
   order — pacing that feels right on a laptop screen often doesn't on a
   phone in your hand. At 1,404 pointers, this is also the first real chance
   to catch any that read flat or samey once they show up days apart instead
   of back to back.
4. **Pricing** (one-time unlock / IAP pack) isn't wired up — no payment
   integration exists in this build.

## Project structure

```
App.tsx                    root state machine (start/looking/resting/settings)
src/
  theme.ts                 colors, serif font, clamp()-style font sizing
  types.ts
  data/pointers.json        1,404 pointers (14 seed + 1,390 new)
  lib/
    pacing.ts               ported reveal-timing formula
    storage.ts              AsyncStorage wrapper (the entire on-device state)
    queue.ts                shuffle-walk queue, never repeats consecutively
    notifications.ts        scheduling, permission timing, jitter
    useReducedMotion.ts
  components/PointerLine.tsx animated line (opacity only, matches spec)
  screens/
    OpeningScreen.tsx
    LookingScreen.tsx
    AfterScreen.tsx          also used as the post-first-launch resting state
    SettingsScreen.tsx
scripts/validate-pointers.mjs  voice-rule + structural checks for pointers.json
```
