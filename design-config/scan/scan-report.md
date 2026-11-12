# Existing design scan: baitaan-tools

Scanned 181 files (CSS/SCSS/LESS, <style> blocks, style="" attributes).

## Pre-filled setup answers (answers.draft.json)

```json
{
  "project": {
    "name": "baitaan-tools",
    "stack": "html-css"
  },
  "colors": {
    "primary": "#D9B85E",
    "foreground": "#FAF6EA",
    "background": "#17130A"
  },
  "typography": {
    "heading_font": "inherit",
    "body_font": "IBM Plex Sans Variable",
    "base_size": 16,
    "overrides": {
      "h2": {
        "desktop": 24
      },
      "h3": {
        "desktop": 18
      }
    }
  },
  "spacing": {
    "base_unit": 4,
    "card_padding": 16,
    "grid_gap": 16,
    "heading_gap_before": 8
  },
  "shape": {
    "preset": "round",
    "button_radius": "full"
  },
  "components": {
    "button_height": 44,
    "input_height": 44
  }
}
```

## How these were chosen

- primary colour from --primary = #D9B85E
- foreground colour from --text = #FAF6EA
- background colour from --bg = #17130A
- Small text sizes in use: 11px, 12px, 13px, 14px, 15px, 16px
- 51% of spacing values fit the 8px grid -> base unit 4px.

## Inconsistencies to decide on

- **Card padding** uses 3 different values: 10px (1×), 18px (1×), 3px (1×)
- **Gap between grid items** uses 2 different values: 16px (2×), 8px (1×)
- **Other gaps** uses 12 different values: 12px (7×), 6px (7×), 10px (4×), 8px (4×), 14px (2×), 2px (2×), 20px (2×), 4px (2×), 16px (1×), 32px (1×), 48px (1×), 7px (1×)
- **Space above headings** uses 4 different values: 8px (2×), 18px (1×), 28px (1×), 32px (1×)
- **h2 size** (desktop) uses 14px (1×), 24px (1×)
- **Corner radius** uses 999px (18×), 16px (7×), 12px (4×), 10px (1×), 18px (1×), 20px (1×), 24px (1×), 7px (1×), 9px (1×)

## Everything in use

- Colours: -
- Named colour variables: --bar-ink #F4F4F5, --foot-ink #F4F4F5, --color-white #1E1910, --bg #17130A, --card #1E1910, --text #FAF6EA, --muted #AEA697, --border #7E7666, --primary #D9B85E, --primary-hover #EBDDB5, --on-primary #1E1910, --link #D9B85E, --result-bg #3A2F14, --result-text #FAF6EA, --tint #F8F1DF, --track #F5F5F4, --err #F87171, --warn #FBBF24, --band #251F10, --field #17130A
- theme.json palette: -
- Fonts: IBM Plex Sans Variable (2×), inherit (1×)
- Font sizes (desktop): 15px (12×), 14px (9×), 13px (6×), 16px (6×), 17px (2×), 20px (2×), 11px (1×), 12px (1×), 18px (1×), 24px (1×), 26px (1×), 40px (1×)
- Font sizes (mobile media queries): -
- Spacing values: 12px (20×), 8px (13×), 14px (12×), 10px (10×), 16px (9×), 6px (9×), 20px (5×), 4px (4×), 2px (3×), 3px (3×), 40px (3×), 18px (2×), 28px (2×), 32px (2×), 36px (2×), 5px (2×), 22px (1×), 24px (1×), 48px (1×), 56px (1×), 7px (1×)
- Radius: 999px (20×), 16px (7×), 12px (5×), 10px (1×), 18px (1×), 20px (1×), 24px (1×), 3px (1×), 7px (1×), 9px (1×)

## Tailwind arbitrary values (fix by hand after setup)

- text-[13px] (12×), text-[15px] (7×), text-[17px] (5×), max-w-[760px] (4×), leading-[1.3] (3×), max-w-[1120px] (3×), tracking-[-0.02em] (3×), leading-[1.15] (2×), leading-[1.2] (2×), leading-[1.45] (2×), text-[34px] (2×), gap-[3px] (1×), h-[26px] (1×), h-[34px] (1×), leading-[1.08] (1×), leading-[1.1] (1×), leading-[1.7] (1×), leading-[1em] (1×), max-w-[13ch] (1×), max-w-[14ch] (1×), max-w-[260px] (1×), max-w-[280px] (1×), max-w-[40ch] (1×), max-w-[48ch] (1×), max-w-[52ch] (1×), max-w-[56ch] (1×), max-w-[60ch] (1×), min-h-[220px] (1×), min-h-[280px] (1×), p-[22px] (1×), pb-[clamp(32px,5vw,56px)] (1×), pt-[clamp(36px,8vw,80px)] (1×), pt-[clamp(48px,12vw,112px)] (1×), py-[0.075em] (1×), rounded-[14px] (1×), rounded-[18px] (1×), rounded-[50%] (1×), sm:text-[2.5rem] (1×), text-[2rem] (1×), text-[clamp(17px,2vw,20px)] (1×), text-[clamp(22px,3vw,28px)] (1×), text-[clamp(24px,3vw,32px)] (1×), text-[clamp(28px,9vw,44px)] (1×), text-[clamp(32px,8vw,52px)] (1×), text-[clamp(38px,10vw,72px)] (1×), tracking-[-0.01em] (1×)

## Next step

Confirm or change the pre-filled answers (the questionnaire asks only about gaps and the
inconsistencies above), run `project_config.py init`, then `project_migrate.py migrate` to
convert the old hard-coded values to tokens.
