import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    // Si no hay query, devolver algunos jugadores por defecto
    if (!q || q.trim().length === 0) {
      const defaultPlayers = await prisma.player.findMany({
        where: {
          deleted: false
        },
        select: {
          id: true,
          playerNumber: true,
          nickname: true,
          fullname: true
        },
        orderBy: [
          { nickname: "asc" },
          { playerNumber: "asc" }
        ],
        take: 10
      });

      // Convertir BigInt a Number para la respuesta
      const sanitizedDefaultPlayers = defaultPlayers.map(player => ({
        ...player,
        playerNumber: Number(player.playerNumber)
      }));

      return NextResponse.json(sanitizedDefaultPlayers);
    }

    const query = q.trim();

    let whereClause: any = {
      deleted: false
    };

    // Si es numérico, buscar por legajo
    if (/^\d+$/.test(query)) {
      whereClause.playerNumber = parseInt(query);
    } else {
      // Buscar por nickname o fullname
      whereClause.OR = [
        { nickname: { contains: query, mode: "insensitive" } },
        { fullname: { contains: query, mode: "insensitive" } }
      ];
    }

    const players = await prisma.player.findMany({
      where: whereClause,
      select: {
        id: true,
        playerNumber: true,
        nickname: true,
        fullname: true
      },
      orderBy: [
        { nickname: "asc" },
        { playerNumber: "asc" }
      ],
      take: 20 // Tomar más para poder reordenar
    });

    // Reordenar para priorizar los que empiezan con la búsqueda
    const sortedPlayers = players.sort((a, b) => {
      const queryLower = query.toLowerCase();
      const aNicknameStarts = a.nickname.toLowerCase().startsWith(queryLower);
      const bNicknameStarts = b.nickname.toLowerCase().startsWith(queryLower);
      const aFullnameStarts = a.fullname?.toLowerCase().startsWith(queryLower) || false;
      const bFullnameStarts = b.fullname?.toLowerCase().startsWith(queryLower) || false;

      // Priorizar los que empiezan con la búsqueda en nickname
      if (aNicknameStarts && !bNicknameStarts) return -1;
      if (!aNicknameStarts && bNicknameStarts) return 1;

      // Luego los que empiezan con la búsqueda en fullname
      if (aFullnameStarts && !bFullnameStarts) return -1;
      if (!aFullnameStarts && bFullnameStarts) return 1;

      // Finalmente ordenar por nickname y luego por legajo
      if (a.nickname !== b.nickname) {
        return a.nickname.localeCompare(b.nickname);
      }
      return a.playerNumber - b.playerNumber;
    });

    // Tomar solo los primeros 10 después del reordenamiento
    const finalPlayers = sortedPlayers.slice(0, 10);

    // Convertir BigInt a Number para la respuesta
    const sanitizedPlayers = finalPlayers.map(player => ({
      ...player,
      playerNumber: Number(player.playerNumber)
    }));

    return NextResponse.json(sanitizedPlayers);
  } catch (error) {
    console.error("Error searching players:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}