function AlertIcon({ width = 24, height = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" aria-hidden="true">
      <path
        d="M12 3.5 22 20.5H2L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 10v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17.3" r="1" fill="currentColor" />
    </svg>
  );
}

export default AlertIcon;
