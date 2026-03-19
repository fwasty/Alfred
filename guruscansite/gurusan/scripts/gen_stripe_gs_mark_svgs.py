from pathlib import Path

OUT = Path('/root/.openclaw/media/out/guruscan-gs-stripe')
OUT.mkdir(parents=True, exist_ok=True)

# Stripe-ish: friendly geometry, rounded, confident. Monochrome.
# Goal: G is the lens, S is negative-space cut, handle minimal.

svgs = {}

# Variant 1: solid G lens with white S cut + minimal handle
svgs['stripe-1-solid'] = r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="white"/>
  <!-- G lens (solid) -->
  <path d="M430 190c-132 0-240 108-240 240s108 240 240 240h80c44 0 80-36 80-80V540c0-22-18-40-40-40H470c-22 0-40 18-40 40s18 40 40 40h120v130c0 22-18 40-40 40h-120c-176 0-320-144-320-320s144-320 320-320h120c98 0 186 45 244 116 14 18 10 44-8 58-18 14-44 10-58-8-44-54-110-88-178-88H430z" fill="#0B0F19"/>

  <!-- handle -->
  <rect x="635" y="635" width="320" height="92" rx="46" fill="#0B0F19" transform="rotate(45 635 635)"/>

  <!-- S cutout (negative space) -->
  <path d="M390 470c0-52 42-94 94-94h108c22 0 40-18 40-40s-18-40-40-40H468c-96 0-174 68-174 170 0 92 72 150 188 150h86c30 0 54 20 54 44 0 26-24 44-54 44H316v80h252c78 0 134-52 134-124 0-72-56-124-134-124h-92c-56 0-86-22-86-62z" fill="white"/>
</svg>'''

# Variant 2: outline lens where G is ring with notch; S is stroke inside
svgs['stripe-2-outline'] = r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="white"/>
  <!-- G ring -->
  <path d="M430 220c-116 0-210 94-210 210s94 210 210 210h110c44 0 80-36 80-80V545" fill="none" stroke="#0B0F19" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M520 545h140" fill="none" stroke="#0B0F19" stroke-width="64" stroke-linecap="round"/>

  <!-- handle -->
  <rect x="632" y="632" width="320" height="92" rx="46" fill="#0B0F19" transform="rotate(45 632 632)"/>

  <!-- S inside -->
  <path d="M355 360c40-28 110-26 150-6 22 10 34 24 34 40 0 22-20 36-58 40l-70 8c-66 8-106 42-106 94 0 56 52 98 136 98 54 0 104-16 136-44" fill="none" stroke="#0B0F19" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

# Variant 3: rounded-square lens (still a G), more app-icon friendly
svgs['stripe-3-app'] = r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="white"/>
  <!-- lens as rounded square G -->
  <path d="M270 300c0-88 72-160 160-160h140c88 0 160 72 160 160v180c0 88-72 160-160 160H430c-88 0-160-72-160-160V300z" fill="none" stroke="#0B0F19" stroke-width="64" stroke-linejoin="round"/>
  <path d="M560 510h170" fill="none" stroke="#0B0F19" stroke-width="64" stroke-linecap="round"/>
  <path d="M560 510v110" fill="none" stroke="#0B0F19" stroke-width="64" stroke-linecap="round"/>

  <rect x="632" y="632" width="320" height="92" rx="46" fill="#0B0F19" transform="rotate(45 632 632)"/>

  <!-- S cut as negative space bar + curve -->
  <path d="M350 420c0-46 38-84 84-84h126" fill="none" stroke="#0B0F19" stroke-width="44" stroke-linecap="round"/>
  <path d="M560 336c-78 0-156 14-156 70 0 26 18 44 52 48l86 10c64 8 94 34 94 74 0 52-52 86-150 86" fill="none" stroke="#0B0F19" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

# Variant 4: solid app tile with white mark (more Stripe-ish product logo)
svgs['stripe-4-tile'] = r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="240" fill="#0B0F19"/>
  <!-- G ring (white) -->
  <path d="M430 250c-99 0-180 81-180 180s81 180 180 180h120c44 0 80-36 80-80V510" fill="none" stroke="white" stroke-width="72" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M540 510h170" fill="none" stroke="white" stroke-width="72" stroke-linecap="round"/>
  <!-- handle -->
  <rect x="610" y="610" width="300" height="88" rx="44" fill="white" transform="rotate(45 610 610)" opacity="0.96"/>
  <!-- S inside -->
  <path d="M360 400c40-32 122-34 168-10 22 12 34 28 34 46 0 26-26 40-72 46l-64 8c-64 8-100 38-100 82 0 54 54 96 142 96 52 0 104-14 142-40" fill="none" stroke="white" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

for name, svg in svgs.items():
    (OUT / f'{name}.svg').write_text(svg)

print('wrote', len(svgs), 'svgs to', OUT)
