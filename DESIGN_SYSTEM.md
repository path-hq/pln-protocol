# PATH Design System

### Version 1.0 | January 2026

---

## Overview

PATH's visual identity is built on a foundation of **dark sophistication** and **institutional trust**. The design language balances the cutting-edge nature of DeFi with the professionalism expected by institutional investors.

**Core Principles:**
- **Dark-first**: Pure black backgrounds create focus and premium feel
- **Teal accents**: Strategic use of #00FFB8 for emphasis and brand recognition
- **Depth through layering**: Cards, gradients, and borders create visual hierarchy
- **Clean typography**: Minimal, readable, no clutter
- **Purposeful whitespace**: Breathing room between elements

---

## 1. Color System

### Primary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Black** | `#000000` | 0, 0, 0 | Page backgrounds |
| **Teal** | `#00FFB8` | 0, 255, 184 | Primary accent, CTAs, highlights |
| **White** | `#FFFFFF` | 255, 255, 255 | Primary text, headlines |

### Surface Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Surface** | `#111111` | Card backgrounds |
| **Surface Light** | `#1a1a1a` | Elevated cards, hover states |
| **Surface Lighter** | `#222222` | Nested elements |

### Border Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Border Dark** | `#222222` | Default card borders |
| **Border Medium** | `#333333` | Subtle separators |
| **Border Light** | `#444444` | Dividers within cards |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Text Primary** | `#FFFFFF` | Headlines, important text |
| **Text Secondary** | `#CCCCCC` | Body text, descriptions |
| **Text Muted** | `#888888` | Labels, secondary info |
| **Text Subtle** | `#666666` | Hints, placeholders |
| **Text Faint** | `#444444` | Disabled states, footnotes |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Teal** | `#00FFB8` | Primary accent |
| **Teal Hover** | `#00E6A5` | Hover states |
| **Red** | `#FF6B6B` | Warnings, problems, alerts |
| **Yellow** | `#FFD93D` | Caution, pending states |
| **Blue** | `#6B9FFF` | Info, links |

### Teal Opacity Scale

```css
--teal-100: rgba(0, 255, 184, 1.0);    /* Solid - buttons, badges */
--teal-40: rgba(0, 255, 184, 0.4);     /* Borders - highlighted cards */
--teal-35: rgba(0, 255, 184, 0.35);    /* Borders - stat boxes */
--teal-30: rgba(0, 255, 184, 0.3);     /* Borders - standard highlight */
--teal-25: rgba(0, 255, 184, 0.25);    /* Borders - subtle highlight */
--teal-12: rgba(0, 255, 184, 0.12);    /* Backgrounds - strong gradient start */
--teal-10: rgba(0, 255, 184, 0.1);     /* Backgrounds - gradient start */
--teal-08: rgba(0, 255, 184, 0.08);    /* Backgrounds - subtle highlight */
--teal-05: rgba(0, 255, 184, 0.05);    /* Backgrounds - very subtle */
--teal-02: rgba(0, 255, 184, 0.02);    /* Backgrounds - gradient end */
```

---

## 2. Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display** | 56-80px | 700 | 1.1 | Hero stats, landing pages |
| **H1** | 26-32px | 700 | 1.2 | Page titles |
| **H2** | 18-22px | 700 | 1.3 | Section headers |
| **H3** | 14-16px | 600 | 1.4 | Card titles |
| **Body** | 13-14px | 400 | 1.6 | Paragraphs, descriptions |
| **Body Small** | 11-12px | 400 | 1.5 | Secondary text |
| **Caption** | 9-10px | 400 | 1.4 | Labels, footnotes |
| **Overline** | 9-10px | 600 | 1.2 | Section labels (uppercase) |

---

## 3. Spacing System

### Base Unit
All spacing is based on a **4px grid**.

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps, inline elements |
| `--space-2` | 8px | Small gaps between related items |
| `--space-3` | 12px | Medium gaps, card internal spacing |
| `--space-4` | 16px | Standard gaps between cards |
| `--space-5` | 20px | Section internal padding |
| `--space-6` | 24px | Page padding, large gaps |
| `--space-8` | 32px | Section separators |
| `--space-10` | 40px | Major section breaks |

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 3px | Badges, tags, small elements |
| `--radius-md` | 6px | Nested items, buttons |
| `--radius-lg` | 8px | Secondary cards |
| `--radius-xl` | 10px | Primary cards |
| `--radius-2xl` | 12px | Large containers, modals |

---

## 5. Components

### Cards

#### Standard Card
```css
.card {
    background: #111111;
    border: 1px solid #222222;
    border-radius: 10px;
    padding: 16px;
}
```

#### Highlighted Card (Gradient) - Signature PATH look
```css
.card-highlight {
    background: linear-gradient(180deg, 
        rgba(0, 255, 184, 0.10) 0%, 
        rgba(0, 255, 184, 0.02) 100%
    );
    border: 1px solid rgba(0, 255, 184, 0.30);
    border-radius: 10px;
    padding: 16px;
}
```

### Buttons

#### Primary Button
```css
.btn-primary {
    background: #00FFB8;
    color: #000000;
    border: none;
    border-radius: 6px;
    padding: 12px 24px;
    font-size: 13px;
    font-weight: 600;
}

.btn-primary:hover {
    background: #00E6A5;
}
```

---

## 6. CSS Variables

```css
:root {
    /* Colors */
    --color-black: #000000;
    --color-surface: #111111;
    --color-surface-light: #1a1a1a;
    --color-border: #222222;
    --color-border-light: #333333;
    --color-teal: #00FFB8;
    --color-teal-hover: #00E6A5;
    --color-red: #FF6B6B;
    --color-text-primary: #FFFFFF;
    --color-text-secondary: #CCCCCC;
    --color-text-muted: #888888;
    --color-text-subtle: #666666;
    --color-text-faint: #444444;

    /* Spacing */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;

    /* Border Radius */
    --radius-sm: 3px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-xl: 10px;

    /* Transitions */
    --transition-fast: 0.15s ease;
    --transition-base: 0.2s ease;
    --transition-slow: 0.3s ease;
}
```

---

## 7. Tailwind Equivalents

```javascript
// tailwind.config.js
module.exports = {
    theme: {
        extend: {
            colors: {
                'path-black': '#000000',
                'path-surface': '#111111',
                'path-surface-light': '#1a1a1a',
                'path-border': '#222222',
                'path-teal': '#00FFB8',
                'path-teal-hover': '#00E6A5',
                'path-red': '#FF6B6B',
            },
            backgroundImage: {
                'gradient-highlight': 'linear-gradient(180deg, rgba(0,255,184,0.1) 0%, rgba(0,255,184,0.02) 100%)',
            },
        },
    },
}
```

---

**Created:** January 2026  
**Version:** 1.0  
**Author:** PATH Protocol
