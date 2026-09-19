# Kaliyattam Theme (Drupal 11 Native)

A native, lightweight, and high-performance Drupal 11 theme designed specifically for sacred ritual arts, Theyyam traditions, and cultural artist portfolios.

## Key Features

- **Native Drupal 11 (`base theme: false`)**: Standalone architecture with zero dependency on contrib base themes (like Bootstrap).
- **100% Pure CSS and Vanilla JS**: No Sass/SCSS compilation, no Node.js/npm dependencies, and zero build tools needed. The entire theme can be copied as-is to any Drupal 11 site and works immediately out of the box.
- **Zero jQuery**: All interactive features (responsive mobile drawer, touch-swipe media carousels, accessible dropdowns) are implemented in pure vanilla modern JavaScript with `Drupal.behaviors`.
- **Single Directory Components (SDC)**: Built using Drupal 11 core SDC standards located in `components/`:
  - `components/card/`: Cultural arts card with cover media, metadata badge, event date, and teaser body.
  - `components/media-carousel/`: Touch-swipe enabled responsive carousel for Theyyam and location galleries.
  - `components/badge/`: Cultural tag and category badges.
- **Mobile-First & Responsive**: Fluid typography (`clamp()`), CSS Grid and Flexbox utilities, accessible mobile navigation drawer, and touch-optimized gestures.
- **Cultural Arts Aesthetic**: Curated color palette (Kaliyattam Crimson `#890000`, Sacred Vermilion, Temple Gold, and Ink Charcoal) tailored for sacred performing arts.
- **Rich Modal Dialog Theming**: Fully styled native Drupal modal dialogs (`css/modal-dialog.css`).

## Directory Structure

```text
kaliyattam_subtheme/
├── components/           # Single Directory Components (SDC)
│   ├── badge/            # Badge component (.yml, .twig, .css)
│   ├── card/             # Art card component (.yml, .twig, .css)
│   └── media-carousel/   # Touch carousel component (.yml, .twig, .css, .js)
├── css/                  # Modular pure CSS stylesheets
│   ├── article.css       # Long-form article and editorial styling
│   ├── base.css          # Modern CSS reset and typography
│   ├── carousel.css      # Standalone carousel styles
│   ├── custom.css        # Site-specific overrides and flag bookmarks
│   ├── event-detail.css  # Hero event detail layout
│   ├── icons.css         # Lightweight inline SVG icon system
│   ├── layout.css        # Responsive CSS Grid & layout system
│   ├── modal-dialog.css  # Rich modal dialog theming
│   ├── navigation.css    # Responsive sticky header & mobile navigation
│   ├── tokens.css        # Cultural arts design tokens (colors, fonts, shadows)
│   └── views-filters.css # Responsive views exposed filters
├── js/                   # Pure Vanilla JavaScript
│   ├── carousel.js       # Touch swipe gesture carousel controller
│   └── navigation.js     # Accessible mobile drawer navigation controller
├── templates/            # Semantic Twig templates
│   ├── block/            # Block branding & wrapper templates
│   ├── content/          # Node templates (theyyam, location, event, cards)
│   ├── field/            # Field & image templates
│   ├── layout/           # HTML5 shell, page, and region layouts
│   ├── navigation/       # Accessible menu templates
│   └── views/            # Responsive views grid layout
├── kaliyattam_subtheme.info.yml
├── kaliyattam_subtheme.libraries.yml
├── kaliyattam_subtheme.breakpoints.yml
└── kaliyattam_subtheme.theme
```
