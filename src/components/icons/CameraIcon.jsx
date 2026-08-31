const CameraIcon = ({ width = 28, height = 28 }) => {
  return (
    <svg viewBox="0 0 28 28" width={width} height={height} fill="none" aria-hidden="true">
      <path
        d="M9 8.5 10.2 6h7.6L19 8.5h2.5A2.5 2.5 0 0 1 24 11v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 4 20v-9a2.5 2.5 0 0 1 2.5-2.5H9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="15" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
};

export default CameraIcon;
