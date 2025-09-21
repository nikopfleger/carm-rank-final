export function getBaseUrlFromHeaders(headers: Headers): string {
    const protoHeader =
        headers.get('x-forwarded-proto') ||
        headers.get('x-forwarded-protocol') ||
        '';
    const proto = protoHeader.split(',')[0]?.trim() || 'https';

    const hostHeader =
        headers.get('x-forwarded-host') ||
        headers.get('host') ||
        '';
    const host = hostHeader.split(',')[0]?.trim();

    if (!host) return '';
    return `${proto}://${host}`;
}
