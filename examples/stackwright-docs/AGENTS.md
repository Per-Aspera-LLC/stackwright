# Stackwright Docs — Agent Guide

Welcome, AI agent! This document provides essential information for working with the Stackwright framework in this project.

## Project Overview

This is the official Stackwright documentation site, built with Next.js + Stackwright.

## Content System

This site uses Stackwright's YAML-driven content system. Pages are defined in `content/pages/` directories as YAML files that reference components.

### Content Type Reference

<!-- stackwright:content-type-table:start -->
The YAML key is the key used inside `content_items` entries. All types inherit `label` (required), `color` (optional), and `background` (optional) from `BaseContent`.

| YAML key | Required fields | Optional fields |
|---|---|---|
| `carousel` | `label` (string), `heading` (string), `items` (CarouselItem[]) | `color` (string), `background` (string), `autoPlaySpeed` (number), `infinite` (boolean), `autoPlay` (boolean) |
| `main` | `label` (string), `heading` (TextBlock), `textBlocks` (TextBlock[]) | `color` (string), `background` (string), `media` (MediaItem), `graphic_position` (`left` | `right`), `buttons` (ButtonContent[]), `textToGraphic` (number) |
| `tabbed_content` | `label` (string), `heading` (TextBlock), `tabs` (object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object[]) | `color` (string), `background` (string) |
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
| `map` | `label` (string), `center` (object), `zoom` (number) | `color` (string), `background` (string), `markers` (object[]), `layers` (object[]), `view` (`map` | `globe`), `terrain` (boolean), `height` (string | number), `width` (string | number) |

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
| `GridColumn` | `width`? (number), `content_items` (object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object[]) |

**TypographyVariant values:** `h1` `h2` `h3` `h4` `h5` `h6` `subtitle1` `subtitle2` `body1` `body2` `caption` `button` `overline`
<!-- stackwright:content-type-table:end -->

## Development Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm test       # Run tests
```

## Quick Tips

- All source code is in `src/components` of the respective packages
- Content types are defined in Zod schemas in `@stackwright/types`
- Theme configuration lives in `stackwright.yml`
