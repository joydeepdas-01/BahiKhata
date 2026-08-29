# BahiKhata Performance Skill

## Purpose
Keep BahiKhata fast on ordinary and low-end Android devices.

## Invoke When
- Adding dependencies.
- Changing startup code.
- Processing large customer lists/CSVs.
- Performance regressions appear.

## Inputs
- Build output
- Runtime profiling
- Bundle analysis
- Device behavior

## Outputs
- Performance findings
- Optimization changes
- Measurements

## Allowed
- Reduce bundle size.
- Memoize only where justified.
- Optimize IndexedDB access.
- Move heavy parsing off the critical UI path.
- Lazy-load non-critical functionality.

## Forbidden
- Premature optimization that harms readability.
- Add large libraries for trivial functions.

## Rules
1. Startup speed is high priority.
2. Main interactions must remain responsive.
3. Optimize for budget Android hardware.
4. Measure before/after meaningful optimizations.

## Verification
- Production build tested.
- Startup and interaction latency reviewed.
- Large-but-realistic CSV test completed.
