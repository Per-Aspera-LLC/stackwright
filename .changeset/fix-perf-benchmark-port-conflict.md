---
---

fix(ci): resolve port conflict in performance benchmark workflow

The performance workflow was manually starting `next start` on port 3000
before running Playwright benchmarks. Since the Playwright config also
defines a `webServer` that starts on port 3000 (with `reuseExistingServer:
false` in CI), every benchmark step failed with a port conflict.

The fix removes the redundant manual build/start steps and uses
`PERF_NO_SERVER` to disable Playwright's webServer for benchmarks that
don't need a running server (build-time, bundle-size). The runtime-vitals
benchmark now uses Playwright's built-in webServer lifecycle as intended.
