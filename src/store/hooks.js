import { useDispatch, useSelector } from "react-redux";

// Thin re-exports (not direct useDispatch/useSelector everywhere) so typed
// hooks could be added later without touching every call site.
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
