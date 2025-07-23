# Stackwright JSON Schemas

This directory contains JSON Schema files that provide autocomplete, validation, and documentation for Stackwright YAML files.

## Schemas

- **`content-schema.json`** - Validates `content.yaml` files in page directories
- **`theme-schema.json`** - Validates theme YAML files

## VS Code Integration

The schemas are automatically applied to matching files via `.vscode/settings.json`:

- `**/pages/*/content.yaml` → `content-schema.json`
- `**/themes/*.yaml` → `theme-schema.json`

## Features

### Autocomplete
- Type `content:` and get suggestions for `content_items`
- Type `- ` in `content_items` and get suggestions for `main`, `carousel`, etc.
- Get property suggestions with descriptions

### Validation
- Real-time error highlighting for invalid properties
- Type checking (strings, numbers, arrays)
- Required property validation
- Enum value validation (e.g., button variants, colors)

### Documentation
- Hover over properties to see descriptions
- Pattern validation for image paths, color codes
- Min/max value constraints

## Testing the Schema

1. Open `test/www/pages/home/content.yaml`
2. Try adding a new content item:
   ```yaml
   - main:  # Should show autocomplete
   ```
3. Add invalid values to see validation errors:
   ```yaml
   - carousel:
       iconsPerRow: 10  # Error: maximum is 6
   ```

## Adding New Content Types

1. Edit `content-schema.json`
2. Add new definition to `definitions` section
3. Add reference to `oneOf` array in content items
4. Update this README with examples
