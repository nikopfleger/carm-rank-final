import { LinkRequestsManagement } from "@/components/admin/link-requests-management";
import { auth } from "@/lib/auth-vercel";
import { hasAuthority } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function LinkRequestsABMPage() {
    // ✅ Verificar autenticación y permisos para gestionar solicitudes de vinculación
    const session = await auth();
    if (!session?.user || !hasAuthority(session.user.authorities, "ABM_MANAGE")) {
        redirect('/auth/signin');
    }

    return <LinkRequestsManagement />;
}
