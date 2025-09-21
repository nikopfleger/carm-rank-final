import { PlayerEditForm } from "@/components/admin/abm/PlayerEditForm";
import { prisma } from "@/lib/database/client";
import Link from "next/link";

export default async function PlayerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const playerId = Number(resolvedParams.id);

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      country: true,
      onlineUsers: {
        where: { deleted: false }
      }
    }
  });

  if (!player) {
    return (
      <div className="p-6">
        <p>No se encontró el jugador.</p>
        <Link href="/admin/abm/players" className="text-blue-500 underline">Volver</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PlayerEditForm initialData={player} />
    </div>
  );
}
