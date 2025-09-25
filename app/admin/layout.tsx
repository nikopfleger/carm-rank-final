import { auth } from "@/lib/auth-vercel";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // evita caché estática en todo /admin

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	// Bypass de auth exclusivo para e2e/local
	if (process.env.E2E_AUTH_BYPASS === "1") {
		return (
			<div className="min-h-screen bg-background text-foreground">
				{children}
			</div>
		);
	}

	const session = await auth();
	if (!session?.user) {
		redirect("/auth/signin?callbackUrl=/admin");
	}

	const role = String(session.user.role || "").toUpperCase();
	const allowed = new Set(["OWNER", "SUPER_ADMIN", "ADMIN"]);
	if (!allowed.has(role)) {
		redirect("/auth/error?error=AccessDenied");
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			{children}
		</div>
	);
}
