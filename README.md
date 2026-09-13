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

## What's implemented

- All four screens (Opening, Looking, After/resting, Settings), matching the
  spec's layout, palette (`#1E2A2C` / `#E8E2D6` / `#8A9694`), and serif type.
- The exact pacing formula from the prototype (`src/lib/pacing.ts`), including
  the 0.85x reduced-motion multiplier and per-line `hold` overrides.
- Tap-to-advance that never skips a line, no progress indicator, no chrome.
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
- Two independent shuffle-walk queues (in-app vs. notification-scheduled) so
  neither can show the same pointer twice in a row, without the app tracking
  or surfacing any view history.

## Web hosting

`.github/workflows/deploy-web.yml` runs `expo export --platform web` and
publishes `dist/` to GitHub Pages on every push to `master`. This is a
**preview for looking at the UI in a browser** — notifications, and true
device pacing feel, only exist on iOS/Android. `app.json`'s
`expo.experiments.baseUrl` is hardcoded to `/looking-app` to match this
repo's Pages path; update it if the repo is ever renamed or moved.

## Known gaps before this should ship to a store

1. **Content.** The spec requires 60-80 pointers minimum for App Review's
   "minimum functionality" bar; this build ships the 14 seed pointers from
   the spec (`src/data/pointers.json`), verbatim. Writing the remaining ~50
   is explicitly called out in the spec as the largest task in the project
   and one that should happen "over weeks rather than in one sitting" — it
   wasn't attempted here rather than filling the gap with rushed pointers
   that break the voice rules in spec §9. Add more by appending objects to
   `pointers.json`; no code changes needed.
2. **App icon / splash / Android notification icon.** Placeholder Expo
   template assets are still in `assets/`. Needs real 1024x1024 icon art
   before a store submission.
3. **EAS project.** `eas.json` has build profiles (`development`, `preview`,
   `production`) but no project is linked yet. Run `eas init` and
   `eas build:configure` once you have an Expo account, then
   `eas build --platform android --profile preview` /
   `eas build --platform ios --profile preview` to get installable builds.
4. **Two-week dogfood + TestFlight/internal track**, per the spec's build
   order — pacing that feels right on a laptop screen often doesn't on a
   phone in your hand.
5. **Pricing** (one-time unlock / IAP pack) isn't wired up — no payment
   integration exists in this build.

## Project structure

```
App.tsx                    root state machine (start/looking/resting/settings)
src/
  theme.ts                 colors, serif font, clamp()-style font sizing
  types.ts
  data/pointers.json        seed pointer content (14 of 60-80 target)
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
```
