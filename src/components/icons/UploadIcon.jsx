function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Back page */}
      <rect x="14" y="9" width="22" height="27" rx="3.5" fill="#E2E8F0" />
      {/* Front page */}
      <rect x="11" y="13" width="22" height="27" rx="3.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <circle cx="15" cy="19" r="0.8" fill="#64748B" />
      <circle cx="15" cy="23" r="0.8" fill="#64748B" />
      <circle cx="15" cy="27" r="0.8" fill="#64748B" />
      <path d="M18 19H27M18 23H27M18 27H27" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default UploadIcon;
