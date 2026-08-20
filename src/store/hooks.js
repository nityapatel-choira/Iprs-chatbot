import { useDispatch, useSelector } from "react-redux";

// Thin re-exports rather than importing useDispatch/useSelector directly
// everywhere - a single place to extend from later (e.g. typed hooks if
// this project ever moves to TypeScript) without touching every call site.
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
