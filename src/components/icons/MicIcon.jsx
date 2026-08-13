function MicIcon({ width = 22, height = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" aria-hidden="true">
      <rect x="8.5" y="3" width="7" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9" y1="21" x2="15" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default MicIcon;
