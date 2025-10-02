'use client';
import { createContext, useContext } from 'react';

export const LocaleContext = createContext<string>('es-AR');
export const useLocale = () => useContext(LocaleContext);


