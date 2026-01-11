# ADR 001: React Native with Expo

**Status**: Accepted
**Date**: 2026-01-11
**Decision Makers**: Technical Team
**Tags**: mobile, framework

## Context

We need to build a mobile application for HVAC technicians that works on both iOS and Android. The app must:

- Work in the field (offline capability is critical)
- Be fast to develop (want MVP in 3-4 months)
- Be maintainable by a small team
- Support over-the-air updates (fix bugs without app store delays)
- Feel native (good performance, native UI patterns)

## Decision

We will use **React Native with Expo (managed workflow)** as our mobile development platform.

## Rationale

### Why React Native?

1. **Cross-platform**: Single codebase for iOS and Android
   - Reduces development time by ~60% vs native
   - Easier maintenance (fix once, works everywhere)
   - Consistent features across platforms

2. **Performance**: Near-native performance for our use case
   - JavaScript runs on separate thread
   - Native components for UI (not WebView)
   - Can drop to native modules if needed

3. **Developer Experience**:
   - Fast Refresh (see changes instantly)
   - Hot reloading during development
   - Chrome DevTools for debugging
   - Excellent TypeScript support

4. **Ecosystem**:
   - Massive community (Meta-backed)
   - Rich library ecosystem
   - Well-documented
   - Easy to find developers

### Why Expo (vs Bare React Native)?

1. **Over-the-Air (OTA) Updates**:
   - Push bug fixes and features instantly
   - No waiting for app store approval
   - Critical for field app (techs need fixes fast)
   - Can update 90% of app without store submission

2. **Simplified Development**:
   - No Xcode or Android Studio setup required
   - Handles native dependencies automatically
   - Managed build process (EAS Build)
   - Less native code to maintain

3. **Built-in Features**:
   - Camera (for part photos, error codes)
   - Push notifications
   - File system access
   - Background tasks
   - All work out of the box

4. **Future-Proof**:
   - Can "eject" to bare workflow if needed
   - Not locked in
   - Expo's Continuous Native Generation (CNG) allows customization

5. **Deployment**:
   - EAS Build (build iOS without Mac)
   - EAS Submit (automate app store submissions)
   - EAS Update (OTA updates)

## Alternatives Considered

### Flutter

**Pros**:

- Excellent performance
- Beautiful UI out of the box
- Single codebase (iOS, Android, Web)

**Cons**:

- Dart language (team knows TypeScript/JavaScript)
- Smaller ecosystem than React
- **No OTA updates** (dealbreaker for us)
- Harder to hire for (smaller talent pool)

**Why rejected**: No OTA updates is a dealbreaker. Techs can't wait days for bug fixes.

### Native iOS (Swift) + Android (Kotlin)

**Pros**:

- Best possible performance
- Full platform access
- Best UX (native patterns)

**Cons**:

- **2x development time** (two separate codebases)
- 2x maintenance burden
- Need expertise in both Swift and Kotlin
- Slower feature velocity
- No code sharing

**Why rejected**: Too slow for MVP. Can't afford to build everything twice.

### Progressive Web App (PWA)

**Pros**:

- Single codebase for all platforms
- Instant updates (no app store)
- Web technologies (HTML/CSS/JS)

**Cons**:

- **iOS Safari limitations** (poor notifications, limited offline)
- Doesn't feel native
- Limited device access (camera, GPS less reliable)
- Users unlikely to "install" it

**Why rejected**: iOS Safari limitations make it unusable for our target users.

### React Native (Bare Workflow)

**Pros**:

- Full control over native code
- Can optimize anything
- No Expo limitations

**Cons**:

- **No OTA updates** (or requires custom setup)
- Need to manage native dependencies
- Need Mac for iOS development
- More complex deployment
- More time spent on native issues

**Why rejected**: OTA updates are critical. Expo gives us this without sacrifice.

## Consequences

### Positive

- **Fast development**: Can ship MVP in 3-4 months
- **OTA updates**: Fix critical bugs in minutes, not days
- **Single codebase**: Easier to maintain, faster to iterate
- **Good ecosystem**: Libraries for everything we need
- **Developer productivity**: Fast Refresh, debugging tools

### Negative

- **Bundle size**: Slightly larger than native (5-7MB)
- **Some performance overhead**: ~5-10% slower than pure native (negligible for our use case)
- **Expo limitations**: Can't use all native libraries (rare edge cases)
- **JavaScript errors**: Need good error boundaries and monitoring

### Risks

1. **Expo limitation discovered**:
   - **Mitigation**: Can eject to bare workflow if absolutely necessary
   - **Likelihood**: Low (Expo supports 95%+ of use cases)

2. **Performance issues**:
   - **Mitigation**: Use performance monitoring, optimize critical paths
   - **Likelihood**: Low (our app is not graphics-intensive)

3. **OTA update failure**:
   - **Mitigation**: Have rollback strategy, test updates thoroughly
   - **Likelihood**: Low (Expo Updates is mature)

## Success Metrics

This decision is successful if:

- [ ] We ship MVP within 4 months
- [ ] App performs smoothly (60 FPS) on mid-range devices
- [ ] We successfully deploy OTA updates within 1 hour of bug discovery
- [ ] App startup time < 3 seconds
- [ ] App bundle size < 10MB

## Review

**Review date**: After MVP launch (Month 6)

Questions to answer:

- Did we encounter any Expo limitations?
- Are we using OTA updates effectively?
- Is performance acceptable?
- Would we make the same decision again?

## References

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo OTA Updates](https://docs.expo.dev/eas-update/introduction/)
- [React Native Performance](https://reactnative.dev/docs/performance)
