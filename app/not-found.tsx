import Link from "next/link";

export default function NotFound() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-4">
                <h1 className="text-2xl font-semibold">Página no encontrada</h1>
                <p className="text-sm text-gray-500">La página que buscas no existe o fue movida.</p>
                <Link href="/" className="px-4 py-2 rounded bg-gray-900 text-white inline-block">
                    Volver al inicio
                </Link>
            </div>
        </main>
    );
}


