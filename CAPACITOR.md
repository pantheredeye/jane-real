# Capacitor Native Platforms

Scaffold only — no native platforms added yet. App ID: `app.routefast.mobile` (must match Play Store / App Store registration).

RouteFast is an SSR app (RedwoodSDK on Cloudflare Workers), so there's no static SPA bundle. The native app is a thin WebView wrapper that loads `https://routefast.app`. `webDir` points to `capacitor-shell/` — a minimal HTML shell Capacitor copies into the native project.

## When to add platforms

- **iOS**: after Apple Developer account verification completes
- **Android**: when ready for Play Store internal testing

`/ios` and `/android` are gitignored — each dev regenerates locally.

## Add a platform

```bash
pnpm add @capacitor/ios       # or @capacitor/android
npx cap add ios               # or: npx cap add android
```

## Build + deploy flow

```bash
pnpm run cap:sync       # copies capacitor-shell/ + updates native deps
pnpm run cap:open:ios   # opens Xcode
pnpm run cap:open:android  # opens Android Studio
```

No `pnpm run build` needed for cap:sync — the shell is static and the real app lives at the remote worker URL.

Build + archive from the IDE for store submission.

## Siri Shortcuts (iOS)

Use `@capacitor-community/shortcuts` plugin bridged to App Intents. Expose agent actions ("Add showing to RouteFast", "Start my route") as intents so Siri can invoke them hands-free while driving.

```bash
pnpm add @capacitor-community/shortcuts
```

Define intents in the iOS project (`ios/App/App/Intents/`) and donate them from the plugin on app launch.

## Push notifications

Web build uses the Push API + VAPID. On native, swap to `@capacitor/push-notifications` — it bridges to APNs (iOS) and FCM (Android). The existing VAPID subscription flow routes through FCM's web-push compatibility layer, so server-side sender logic can stay the same.

```bash
pnpm add @capacitor/push-notifications
```

Register device token on login and store alongside the existing `PushSubscription` rows (add a `platform` discriminator column).

## Gotchas

- For live-reload dev on device, uncomment the `server.url` block in `capacitor.config.ts`
- App Store / Play Store app ID must match `app.routefast.mobile` exactly
- The shell redirects to `https://routefast.app` — update that URL in `capacitor-shell/index.html` if the domain changes
