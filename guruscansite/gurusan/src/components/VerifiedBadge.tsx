export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
        title="Verified on Guru Scan"
      >
        <span aria-hidden>✓</span>
        Verified
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[color:var(--text)]"
      title="Unverified — log in to claim this profile"
    >
      <span
        aria-hidden
        className="grid size-4 place-items-center rounded-full border border-[color:var(--border)] bg-white/60 text-[10px]"
      >
        ✓
      </span>
      Claim
    </span>
  )
}
