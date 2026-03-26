# Hello Stackwright Example — Agent Guide

Working example of a Stackwright-powered Next.js site using Pages Router, static generation, dark mode, and the full component stack.

## Project Structure

```
examples/hellostackwrightnext/
├── content/                  # YAML content files
│   ├── pages/               # Page content definitions (images can be co-located here)
│   └── site.yaml            # Global site configuration
├── pages/                   # Next.js Pages Router
│   ├── _app.tsx             # Registers Next.js + shadcn + icon components
│   ├── _document.tsx        # Uses StackwrightDocument (ColorModeScript for dark mode)
│   ├── index.ts             # Home page (static props)
│   ├── [slug].tsx           # Dynamic slug-based routing
│   └── ...                  # Static pages (about, blog, showcase, etc.)
├── public/                  # Static assets (images copied here by prebuild)
├── next.config.js           # Uses createStackwrightNextConfig()
└── package.json             # prebuild/predev hooks for image co-location
```

## App Setup

The `_app.tsx` registers all three component systems before first render:

```typescript
import { registerNextJSComponents } from '@stackwright/nextjs';
import { registerDefaultIcons } from '@stackwright/icons';
import { registerShadcnComponents } from '@stackwright/ui-shadcn';
import '@stackwright/ui-shadcn/styles.css';

registerNextJSComponents();
registerDefaultIcons();
registerShadcnComponents();
```

The `_document.tsx` uses `StackwrightDocument` from `@stackwright/nextjs` which includes the `ColorModeScript` blocking script for flash-free dark mode.

## Development

```bash
# From monorepo root
pnpm dev:hellostackwright

# From this directory
pnpm dev
```

The prebuild step (`stackwright-prebuild`) runs automatically via `predev`/`prebuild` hooks — it processes YAML content and co-located images into `public/stackwright-content/`.

## Content Modification

1. **Add/edit pages**: Create or modify YAML files in `content/pages/`
2. **Site config**: Edit `content/site.yaml` (theme, navigation, app bar, footer, SEO)
3. **Co-locate images**: Place images next to YAML files using `./relative` paths

Pages are automatically available at their corresponding URL slug.

## Theme System

Themes are defined in `content/site.yaml` under the `theme` key:
- `colors` — Light mode palette (7 required keys: primary, secondary, accent, background, surface, text, textSecondary)
- `darkColors` — Dark mode palette (same shape, optional)
- `typography` — Font families
- `spacing` — Spacing scale

The `ThemeProvider` resolves colors for the active mode. Components use `useSafeTheme()` and get the correct palette automatically.

## Content Type Reference

**AGENTS: This table is auto-generated from the live Zod schemas. Run `pnpm stackwright -- generate-agent-docs` from the monorepo root to regenerate. Do NOT edit the content between the markers manually.**

<!-- stackwright:content-type-table:start -->
The YAML key is the key used inside `content_items` entries. All types inherit `label` (required), `color` (optional), and `background` (optional) from `BaseContent`.

| YAML key | Required fields | Optional fields |
|---|---|---|
| `carousel` | `label` (string), `heading` (string), `items` (CarouselItem[]) | `color` (string), `background` (string), `autoPlaySpeed` (number), `infinite` (boolean), `autoPlay` (boolean) |
| `main` | `label` (string), `heading` (TextBlock), `textBlocks` (TextBlock[]) | `color` (string), `background` (string), `media` (MediaItem), `graphic_position` (`left` | `right`), `buttons` (ButtonContent[]), `textToGraphic` (number) |
| `tabbed_content` | `label` (string), `heading` (TextBlock), `tabs` (object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object[]) | `color` (string), `background` (string) |
| `media` | `label` (string), `src` (string) | `color` (string), `background` (string), `alt` (string), `height` (number | string), `width` (number | string), `style` (`contained` | `overflow`) |
| `timeline` | `label` (string), `items` (TimelineItem[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `icon_grid` | `label` (string), `icons` (IconContent[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `code_block` | `label` (string), `code` (string) | `color` (string), `background` (string), `language` (string), `lineNumbers` (boolean) |
| `feature_list` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock), `columns` (number) |
| `testimonial_grid` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock), `columns` (number) |
| `faq` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `pricing_table` | `label` (string), `plans` (object[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `alert` | `label` (string), `variant` (`info` | `warning` | `success` | `danger` | `note` | `tip`), `body` (string) | `color` (string), `background` (string), `title` (string) |
| `contact_form_stub` | `label` (string), `email` (string) | `color` (string), `background` (string), `heading` (TextBlock), `description` (string), `email_subject` (string), `phone` (string), `address` (string), `button_text` (string) |
| `text_block` | `label` (string), `textBlocks` (TextBlock[]) | `color` (string), `background` (string), `heading` (TextBlock), `buttons` (ButtonContent[]) |
| `grid` | `label` (string), `columns` (GridColumn[]) | `color` (string), `background` (string), `heading` (TextBlock), `gap` (string), `stackBelow` (number) |
| `collection_list` | `label` (string), `source` (string), `layout` (default), `card` (object) | `columns` (number), `limit` (number), `hrefPrefix` (string), `heading` (TextBlock), `background` (string), `color` (string) |
| `video` | `label` (string), `src` (string) | `color` (string), `background` (string), `alt` (string), `height` (number | string), `width` (number | string), `style` (`contained` | `overflow`), `poster` (string), `autoplay` (boolean), `loop` (boolean), `muted` (boolean), `controls` (boolean), `preload` (`auto` | `metadata` | `none`), `sources` (object[]) |

**Sub-type reference:**

| Type | Fields |
|---|---|
| `TextBlock` | `text` (string), `textSize` (TypographyVariant), `textColor`? (string) |
| `ButtonContent` | `text` (string), `textSize` (TypographyVariant), `textColor`? (string), `variant` (`text` | `outlined` | `contained`), `variantSize`? (`small` | `medium` | `large`), `href`? (string), `action`? (string), `icon`? (MediaItem), `alignment`? (`left` | `center` | `right`), `bgColor`? (string) |
| `MediaItem` | Discriminated union: `type: "media"` \| `type: "icon"` \| `type: "image"` \| `type: "video"`. `type` field is required and acts as discriminator. |
| `ImageContent` | `label` (string), `color`? (string), `background`? (string), `src` (string), `alt`? (string), `height`? (number | string), `width`? (number | string), `style`? (`contained` | `overflow`), `type` ("image"), `aspect_ratio`? (number) |
| `IconContent` | `label` (string), `color`? (string), `background`? (string), `src` (string), `alt`? (string), `height`? (number | string), `width`? (number | string), `style`? (`contained` | `overflow`), `type` ("icon"), `size`? (number | TypographyVariant) |
| `CarouselItem` | `title` (string), `text` (string), `media` (MediaItem), `background`? (string) |
| `TimelineItem` | `year` (string), `event` (string) |
| `GridColumn` | `width`? (number), `content_items` (object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object[]) |

**TypographyVariant values:** `h1` `h2` `h3` `h4` `h5` `h6` `subtitle1` `subtitle2` `body1` `body2` `caption` `button` `overline`
<!-- stackwright:content-type-table:end -->

## YAML Examples

### Main Content Section
```yaml
- main:
    label: "section-identifier"
    heading:
      text: "Section Title"
      textSize: "h1"
    textBlocks:
      - text: "Description text"
        textSize: "body1"
    buttons:
      - text: "Button Text"
        textSize: "body1"
        variant: "contained"
        href: "/target-page"
```

### Icon Grid
```yaml
- icon_grid:
    label: "features-grid"
    heading:
      text: "Features"
      textSize: "h2"
    icons:
      - type: "icon"
        label: "feature-icon"
        src: "CheckCircle"
        color: "#4caf50"
        height: 48
```

## Troubleshooting

- **Missing components**: Verify all three `register*()` calls are in `_app.tsx`
- **Dark mode flash**: Verify `_document.tsx` uses `StackwrightDocument`
- **Images not found**: Check that `prebuild`/`predev` hooks exist in `package.json`
- **Build failures**: Clear `.next` directory and rebuild

## References

- [Stackwright Core](../../packages/core/AGENTS.md)
- [Next.js Adapter](../../packages/nextjs/AGENTS.md)
- [Theme System](../../packages/themes/AGENTS.md)
- [Type System](../../packages/types/AGENTS.md)
- [Icons](../../packages/icons/AGENTS.md)
