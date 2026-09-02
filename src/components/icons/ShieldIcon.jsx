const SHIELD_PATH = "M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4Z";

const ShieldIcon = ({ width = 18, height = 18, variant = "outlined" }) => {
  if (variant === "filled") {
    return (
      <svg viewBox="0 0 24 24" width={width} height={height} fill="none" aria-hidden="true">
        <path d={SHIELD_PATH} fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width={width} height={height} fill="none" aria-hidden="true">
      <path d={SHIELD_PATH} fill="currentColor" opacity="0.15" />
      <path d={SHIELD_PATH} stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8.5 12.2 11 14.5l4.5-5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ShieldIcon;
