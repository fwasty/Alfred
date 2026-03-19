from pathlib import Path

OUT = Path('/root/.openclaw/media/out/guruscan-logos2')
OUT.mkdir(parents=True, exist_ok=True)

# Simple, clean vector marks. No text. 1024 viewbox.
logos = {
"mark-a": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#38BDF8"/>
      <stop offset="1" stop-color="#A855F7"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000" flood-opacity="0.14"/>
    </filter>
  </defs>
  <g filter="url(#soft)">
    <!-- lens -->
    <circle cx="430" cy="430" r="220" fill="none" stroke="#0B0F19" stroke-width="46"/>
    <circle cx="430" cy="430" r="160" fill="none" stroke="url(#g)" stroke-width="32" opacity="0.95"/>
    <!-- handle -->
    <rect x="585" y="585" width="300" height="72" rx="36" fill="#0B0F19" transform="rotate(45 585 585)"/>
    <!-- scan sparkle/check -->
    <path d="M392 444 L420 472 L486 406" fill="none" stroke="url(#g)" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>''',

"mark-b": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22C55E"/>
      <stop offset="1" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <!-- magnifier built from rounded strokes -->
  <circle cx="448" cy="448" r="240" fill="none" stroke="#0B0F19" stroke-width="48"/>
  <circle cx="448" cy="448" r="176" fill="none" stroke="url(#g)" stroke-width="28"/>
  <rect x="650" y="650" width="290" height="76" rx="38" fill="#0B0F19" transform="rotate(45 650 650)"/>
  <!-- star rating bar inside lens -->
  <g transform="translate(330 500)">
    <rect x="0" y="0" width="240" height="32" rx="16" fill="#0B0F19" opacity="0.10"/>
    <rect x="0" y="0" width="180" height="32" rx="16" fill="url(#g)"/>
    <path d="M28 16 l10 -7 l-4 12 l10 7 h-12 l-4 12 l-4-12 h-12 l10-7 l-4-12z" fill="#0B0F19" opacity="0.35" transform="translate(210 -2) scale(0.9)"/>
  </g>
</svg>''',

"mark-c": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#38BDF8"/>
      <stop offset="0.55" stop-color="#A855F7"/>
      <stop offset="1" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <!-- lens as rounded square -->
  <rect x="220" y="220" width="460" height="460" rx="140" fill="none" stroke="#0B0F19" stroke-width="54"/>
  <rect x="280" y="280" width="340" height="340" rx="120" fill="none" stroke="url(#g)" stroke-width="30"/>
  <!-- handle -->
  <rect x="610" y="610" width="320" height="86" rx="43" fill="#0B0F19" transform="rotate(45 610 610)"/>
  <!-- scan lines -->
  <g stroke="url(#g)" stroke-width="26" stroke-linecap="round" opacity="0.95">
    <path d="M320 424 H580"/>
    <path d="M320 496 H540"/>
    <path d="M320 568 H500"/>
  </g>
</svg>''',

"mark-d": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#38BDF8"/>
      <stop offset="1" stop-color="#A855F7"/>
    </linearGradient>
  </defs>
  <!-- circle lens + shield check to suggest trust -->
  <circle cx="420" cy="420" r="230" fill="none" stroke="#0B0F19" stroke-width="50"/>
  <circle cx="420" cy="420" r="168" fill="none" stroke="url(#g)" stroke-width="28"/>
  <rect x="600" y="600" width="320" height="82" rx="41" fill="#0B0F19" transform="rotate(45 600 600)"/>
  <g transform="translate(360 330)">
    <path d="M60 0 C85 18 114 18 140 0 V76 C140 122 107 158 100 162 C93 158 60 122 60 76 Z" fill="url(#g)" opacity="0.95"/>
    <path d="M82 80 L96 94 L124 66" fill="none" stroke="#0B0F19" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>'''
}

for name, svg in logos.items():
    (OUT / f'{name}.svg').write_text(svg)

print('wrote', len(logos), 'svg files to', OUT)
