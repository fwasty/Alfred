from pathlib import Path

OUT = Path('/root/.openclaw/media/out/guruscan-gs-marks')
OUT.mkdir(parents=True, exist_ok=True)

# Monochrome, minimal, GS clearly, in/with magnifier.

svgs = {
"gs-1": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="white"/>
  <!-- lens ring -->
  <circle cx="430" cy="430" r="240" fill="none" stroke="#0B0F19" stroke-width="56"/>
  <!-- handle -->
  <rect x="610" y="610" width="320" height="92" rx="46" fill="#0B0F19" transform="rotate(45 610 610)"/>
  <!-- GS monogram (bold, geometric) -->
  <g fill="#0B0F19">
    <!-- G -->
    <path d="M300 430c0-86 70-156 156-156h34c54 0 104 28 132 74l-54 26c-18-30-46-48-78-48h-34c-50 0-92 41-92 104s42 104 92 104h60v-60h-70v-54h124v168h-114c-86 0-156-70-156-156z"/>
    <!-- S -->
    <path d="M540 582c0-40 30-70 78-70h86c18 0 28-10 28-22 0-14-12-22-28-22h-88c-62 0-104-38-104-94 0-56 44-94 110-94h134v54H622c-34 0-52 14-52 40 0 26 20 40 52 40h90c58 0 96 34 96 84 0 54-38 84-96 84h-88c-20 0-30 10-30 24 0 14 12 24 30 24h146v54H622c-54 0-82-28-82-70z"/>
  </g>
</svg>''',

"gs-2": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="white"/>
  <!-- lens ring (rounded square) -->
  <rect x="180" y="180" width="520" height="520" rx="190" fill="none" stroke="#0B0F19" stroke-width="58"/>
  <!-- handle -->
  <rect x="610" y="610" width="330" height="94" rx="47" fill="#0B0F19" transform="rotate(45 610 610)"/>
  <!-- GS: ultra simple strokes -->
  <g fill="none" stroke="#0B0F19" stroke-width="66" stroke-linecap="round" stroke-linejoin="round">
    <!-- G as almost-circle with notch -->
    <path d="M340 430c0-86 62-146 146-146 70 0 122 36 140 90"/>
    <path d="M626 430h-96"/>
    <path d="M530 430v86"/>
    <!-- S as two arcs -->
    <path d="M600 330c46 0 74 22 74 50 0 30-24 44-70 44-56 0-84 18-84 50 0 30 30 50 80 50"/>
  </g>
</svg>''',

"gs-3": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="white"/>
  <!-- lens ring -->
  <circle cx="420" cy="420" r="250" fill="none" stroke="#0B0F19" stroke-width="52"/>
  <!-- handle (lighter) -->
  <rect x="590" y="590" width="340" height="86" rx="43" fill="#0B0F19" transform="rotate(45 590 590)" opacity="0.92"/>
  <!-- GS letters in a single monoline for premium feel -->
  <g fill="none" stroke="#0B0F19" stroke-width="44" stroke-linecap="round" stroke-linejoin="round">
    <!-- G -->
    <path d="M320 420a120 120 0 1 1 0 1"/>
    <path d="M380 420h90"/>
    <path d="M470 420v60"/>
    <!-- S -->
    <path d="M565 340c52 0 86 22 86 52 0 34-30 48-90 48-60 0-90 18-90 52 0 34 34 54 94 54"/>
  </g>
</svg>''',

"gs-4": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="white"/>
  <!-- very minimal magnifier: ring + handle only -->
  <circle cx="430" cy="430" r="240" fill="none" stroke="#0B0F19" stroke-width="58"/>
  <rect x="612" y="612" width="320" height="92" rx="46" fill="#0B0F19" transform="rotate(45 612 612)"/>
  <!-- GS: tight typographic lock inside lens -->
  <text x="290" y="500" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="220" font-weight="900" fill="#0B0F19" letter-spacing="-18">GS</text>
</svg>'''
}

for name, svg in svgs.items():
    (OUT / f'{name}.svg').write_text(svg)

print('wrote', len(svgs), 'svgs to', OUT)
