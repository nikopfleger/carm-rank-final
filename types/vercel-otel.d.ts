declare module '@vercel/otel' {
    export function registerOTel(options?: { serviceName?: string }): Promise<void>;
}


