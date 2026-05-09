import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@store/index';

/** Typed dispatch hook — use this instead of plain useDispatch */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed selector hook — use this instead of plain useSelector */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
