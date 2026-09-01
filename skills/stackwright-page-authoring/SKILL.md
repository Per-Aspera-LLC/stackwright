---
name: stackwright-page-authoring
description: Use before writing or editing Stackwright page YAML (content_items). Generated reference for every core content type — required/optional fields, enum values, sub-type shapes, and minimal YAML examples.
version: 1.0.0
author: stackwright (generated)
tags:
  - stackwright
  - yaml
  - page-authoring
  - content-types
---

# Stackwright Page Authoring

> Auto-generated from the live `@stackwright/types` Zod schemas by
> `stackwright generate-skills`. Do NOT edit by hand — regenerate instead.

## Authoring rules

- Page content lives under `content.content_items` in page YAML files.
- `content_items` is a discriminated union on `type` — every item MUST carry a `type` field
  set to one of the YAML keys listed below.
- All content types inherit from `BaseContent`: `label` (required), `color` (optional),
  `background` (optional).
- The schemas are strict: unknown fields are rejected at validation time. Use exactly the
  field names documented here.

Valid `type` keys: `carousel`, `main`, `tabbed_content`, `media`, `timeline`, `icon_grid`, `code_block`, `feature_list`, `testimonial_grid`, `faq`, `pricing_table`, `alert`, `contact_form_stub`, `form`, `text_block`, `grid`, `collection_list`, `video`, `map`

## Content types

### `carousel`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | string | yes |
| `autoPlaySpeed` | number | no |
| `infinite` | boolean | no |
| `autoPlay` | boolean | no |
| `items` | CarouselItem[] | yes |

Example:

```yaml
- label: example
  type: carousel
  heading: example
  items:
    - title: example
      text: example
      media:
        src: example
        type: media
```

### `main`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | yes |
| `textBlocks` | TextBlock[] | yes |
| `media` | MediaItem | no |
| `graphic_position` | `left` | `right` | no |
| `buttons` | ButtonContent[] | no |
| `textToGraphic` | number | no |

Example:

```yaml
- label: example
  type: main
  heading:
    text: example
    textSize: h1
  textBlocks:
    - text: example
      textSize: h1
```

### `tabbed_content`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | yes |
| `tabs` | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object[] | yes |

Example:

```yaml
- label: example
  type: tabbed_content
  heading:
    text: example
    textSize: h1
  tabs:
    - label: example
      type: carousel
      heading: example
      items:
        - title: example
          text: example
          media: null
```

### `media`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `src` | string | yes |
| `alt` | string | no |
| `height` | number | string | no |
| `width` | number | string | no |
| `style` | `contained` | `overflow` | no |

Example:

```yaml
- label: example
  src: example
  type: media
```

### `timeline`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `items` | TimelineItem[] | yes |
| `layout` | `vertical` | `horizontal` | no |

Example:

```yaml
- label: example
  type: timeline
  items:
    - year: example
      event: example
```

### `icon_grid`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `icons` | IconContent[] | yes |

Example:

```yaml
- label: example
  type: icon_grid
  icons:
    - label: example
      src: example
      type: icon
```

### `code_block`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `code` | string | yes |
| `language` | string | no |
| `lineNumbers` | boolean | no |

Example:

```yaml
- label: example
  type: code_block
  code: example
```

### `feature_list`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `columns` | number | no |
| `items` | object[] | yes |

Example:

```yaml
- label: example
  type: feature_list
  items:
    - heading: example
      description: example
```

### `testimonial_grid`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `columns` | number | no |
| `items` | object[] | yes |

Example:

```yaml
- label: example
  type: testimonial_grid
  items:
    - quote: example
      name: example
```

### `faq`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `items` | object[] | yes |

Example:

```yaml
- label: example
  type: faq
  items:
    - question: example
      answer: example
```

### `pricing_table`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `plans` | object[] | yes |

Example:

```yaml
- label: example
  type: pricing_table
  plans:
    - name: example
      price: example
      features:
        - example
      cta_text: example
      cta_href: example
```

### `alert`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `variant` | `info` | `warning` | `success` | `danger` | `note` | `tip` | yes |
| `title` | string | no |
| `body` | string | yes |

Example:

```yaml
- label: example
  type: alert
  variant: info
  body: example
```

### `contact_form_stub`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `description` | string | no |
| `email` | string | yes |
| `email_subject` | string | no |
| `phone` | string | no |
| `address` | string | no |
| `button_text` | string | no |

Example:

```yaml
- label: example
  type: contact_form_stub
  email: example
```

### `form`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `description` | string | no |
| `fields` | object[] | yes |
| `action` | string | yes |
| `method` | `GET` | `POST` | no |
| `submit_text` | string | no |
| `success_message` | string | no |

Example:

```yaml
- label: example
  type: form
  fields:
    - name: example
      type: text
  action: example
```

### `text_block`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `textBlocks` | TextBlock[] | yes |
| `buttons` | ButtonContent[] | no |

Example:

```yaml
- label: example
  type: text_block
  textBlocks:
    - text: example
      textSize: h1
```

### `grid`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `heading` | TextBlock | no |
| `columns` | GridColumn[] | yes |
| `gap` | string | no |
| `stackBelow` | number | no |

Example:

```yaml
- label: example
  type: grid
  columns:
    - content_items:
        - label: example
          type: carousel
          heading: example
          items:
            - null
```

### `collection_list`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `source` | string | yes |
| `layout` | default | yes |
| `columns` | number | no |
| `limit` | number | no |
| `hrefPrefix` | string | no |
| `card` | object | yes |
| `heading` | TextBlock | no |
| `background` | string | no |
| `color` | string | no |

Example:

```yaml
- type: collection_list
  label: example
  source: example
  layout: null
  card:
    title: example
```

### `video`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `src` | string | yes |
| `alt` | string | no |
| `height` | number | string | no |
| `width` | number | string | no |
| `style` | `contained` | `overflow` | no |
| `poster` | string | no |
| `autoplay` | boolean | no |
| `loop` | boolean | no |
| `muted` | boolean | no |
| `controls` | boolean | no |
| `preload` | `auto` | `metadata` | `none` | no |
| `sources` | object[] | no |

Example:

```yaml
- label: example
  src: example
  type: video
```

### `map`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `center` | object | yes |
| `zoom` | number | yes |
| `markers` | object[] | no |
| `layers` | object[] | no |
| `view` | `map` | `globe` | no |
| `terrain` | boolean | no |
| `height` | string | number | no |
| `width` | string | number | no |

Example:

```yaml
- label: example
  type: map
  center:
    lat: 1
    lng: 1
  zoom: 1
```

## Sub-type reference

### `TextBlock`

| Field | Type | Required |
|---|---|---|
| `text` | string | yes |
| `textSize` | TypographyVariant | yes |
| `textColor` | string | no |
| `format` | `plain` | `markdown` | no |

### `ButtonContent`

| Field | Type | Required |
|---|---|---|
| `text` | string | yes |
| `textSize` | TypographyVariant | yes |
| `textColor` | string | no |
| `format` | `plain` | `markdown` | no |
| `variant` | `text` | `outlined` | `contained` | yes |
| `variantSize` | `small` | `medium` | `large` | no |
| `href` | string | no |
| `action` | string | no |
| `icon` | MediaItem | no |
| `alignment` | `left` | `center` | `right` | no |
| `bgColor` | string | no |

### `MediaItem`

Discriminated union: `type: "media"` | `type: "icon"` | `type: "image"` | `type: "video"`. The `type` field is required and acts as the discriminator.

### `ImageContent`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `src` | string | yes |
| `alt` | string | no |
| `height` | number | string | no |
| `width` | number | string | no |
| `style` | `contained` | `overflow` | no |
| `type` | "image" | yes |
| `aspect_ratio` | number | no |

### `IconContent`

| Field | Type | Required |
|---|---|---|
| `label` | string | yes |
| `color` | string | no |
| `background` | string | no |
| `src` | string | yes |
| `alt` | string | no |
| `height` | number | string | no |
| `width` | number | string | no |
| `style` | `contained` | `overflow` | no |
| `type` | "icon" | yes |
| `size` | number | TypographyVariant | no |

### `CarouselItem`

| Field | Type | Required |
|---|---|---|
| `title` | string | yes |
| `text` | string | yes |
| `media` | MediaItem | yes |
| `background` | string | no |

### `TimelineItem`

| Field | Type | Required |
|---|---|---|
| `year` | string | yes |
| `event` | string | yes |
| `yearColor` | string | no |
| `cardBackground` | string | no |
| `dotColor` | string | no |

### `GridColumn`

| Field | Type | Required |
|---|---|---|
| `width` | number | no |
| `content_items` | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object[] | yes |

## Enums

**TypographyVariant** (used by `textSize`): `h1` `h2` `h3` `h4` `h5` `h6` `subtitle1` `subtitle2` `body1` `body2` `caption` `button` `overline`
