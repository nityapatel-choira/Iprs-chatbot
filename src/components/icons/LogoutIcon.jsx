const LogoutIcon = ({ className }) => {
  return (
    <svg viewBox="0 0 20 20" width="1.5em" height="1.5em" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12.5 6V4.5A1.5 1.5 0 0 0 11 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H11a1.5 1.5 0 0 0 1.5-1.5V14"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M8.5 10h8.5M14.5 7.5 17 10l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
export default LogoutIcon;
