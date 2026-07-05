---
"@stackwright/build-scripts": minor
"@stackwright/types": minor
"@stackwright/core": patch
---

Image optimization pipeline with sharp in prebuild (ri2)

During `stackwright-prebuild`, co-located images are now automatically processed through sharp:

- **WebP/AVIF variants** generated alongside originals in `public/images/`
- **Blur placeholders** (tiny base64 data URIs) injected into page content JSON as `blurDataURL`
- **Image manifest** (`_image-manifest.json`) emitted for tooling/debugging
- **Automatic downscaling** when images exceed `maxWidth` (default: 1920px)

Configuration via `stackwright.yml`:

```yaml
imageOptimization:
  enabled: true # default: true
  formats: [webp] # options: webp, avif
  quality: 80 # 1-100
  maxWidth: 1920 # pixels
  blur: true # generate blur placeholders
  blurSize: 10 # blur placeholder width in px
```

Disable via CLI: `stackwright-prebuild --no-image-optimization`

The `<Media>` component (core) automatically passes `placeholder="blur"` and `blurDataURL` to `<NextStackwrightImage>` when blur data is present in the content JSON. No user-side changes required — existing sites get blur placeholders automatically.
