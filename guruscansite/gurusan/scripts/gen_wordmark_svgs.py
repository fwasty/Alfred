from pathlib import Path

OUT = Path('/root/.openclaw/media/out/guruscan-wordmarks')
OUT.mkdir(parents=True, exist_ok=True)

# We generate clean, monochrome-first wordmarks. No gradients.
# Font note: renderers will substitute; but we keep it simple.

wordmarks = {
"wm-1": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600">
  <rect width="1600" height="600" fill="white"/>
  <!-- Wordmark: GuruScan (custom G with scan notch) -->
  <g fill="none" stroke="#0B0F19" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
    <path d="M230 300a150 150 0 1 1 0 1"/>
    <path d="M300 300h95"/>
    <path d="M395 300v70"/>
  </g>
  <text x="470" y="350" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="170" font-weight="700" fill="#0B0F19" letter-spacing="-4">
    uruScan
  </text>
  <!-- subtle scan cut line through the S -->
  <path d="M790 250h520" stroke="#0B0F19" stroke-width="10" opacity="0.12"/>
</svg>''',

"wm-2": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600">
  <rect width="1600" height="600" fill="white"/>
  <!-- Minimal: small mark dot + word -->
  <circle cx="240" cy="300" r="18" fill="#0B0F19"/>
  <text x="285" y="350" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="190" font-weight="800" fill="#0B0F19" letter-spacing="-6">
    GuruScan
  </text>
  <!-- scan underline -->
  <rect x="285" y="385" width="600" height="12" rx="6" fill="#0B0F19" opacity="0.10"/>
  <rect x="285" y="385" width="210" height="12" rx="6" fill="#0B0F19"/>
</svg>''',

"wm-3": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600">
  <rect width="1600" height="600" fill="white"/>
  <!-- Custom G built from rounded square + cut -->
  <rect x="150" y="210" width="220" height="220" rx="90" fill="none" stroke="#0B0F19" stroke-width="34"/>
  <path d="M260 320h120v85" fill="none" stroke="#0B0F19" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="410" y="350" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="190" font-weight="800" fill="#0B0F19" letter-spacing="-6">
    uruScan
  </text>
  <!-- tiny accent: scan notch -->
  <rect x="150" y="315" width="60" height="18" rx="9" fill="#0B0F19"/>
</svg>''',

"wm-4": r'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600">
  <rect width="1600" height="600" fill="white"/>
  <!-- Ultra clean: wordmark + micro “scan” brackets -->
  <text x="210" y="350" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="200" font-weight="850" fill="#0B0F19" letter-spacing="-7">
    GuruScan
  </text>
  <g stroke="#0B0F19" stroke-width="16" stroke-linecap="round" opacity="0.18">
    <path d="M1180 250v220"/>
    <path d="M1280 250v220"/>
  </g>
</svg>'''
}

for name, svg in wordmarks.items():
    (OUT / f'{name}.svg').write_text(svg)

print('wrote', len(wordmarks), 'wordmark svgs to', OUT)
