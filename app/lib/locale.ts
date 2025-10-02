import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { headers } from 'next/headers';

const SUPPORTED = ['es-AR', 'es-ES', 'en-US', 'pt-BR'];
const FALLBACK = 'es-AR';

export function getRequestLocale(): string {
    const h = headers();
    const accept = h.get('accept-language') ?? '';
    const languages = new Negotiator({ headers: { 'accept-language': accept } }).languages();
    return matchLocale(languages, SUPPORTED, FALLBACK);
}


