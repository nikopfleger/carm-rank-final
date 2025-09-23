"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // eslint-disable-next-line no-console
        console.error("App error:", error);
    }, [error]);

    return (
        <html>
            <body className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-4">
                    <h1 className="text-2xl font-semibold">Ocurrió un error</h1>
                    <p className="text-sm text-gray-500">Intenta nuevamente o vuelve al inicio.</p>
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={() => reset()} className="px-4 py-2 rounded bg-gray-900 text-white">
                            Reintentar
                        </button>
                        <Link href="/" className="px-4 py-2 rounded border">
                            Ir al inicio
                        </Link>
                    </div>
                    {process.env.NODE_ENV !== 'production' && (
                        <pre className="mt-4 text-left text-xs whitespace-pre-wrap opacity-70">{String(error?.message ?? '')}</pre>
                    )}
                </div>
            </body>
        </html>
    );
}



