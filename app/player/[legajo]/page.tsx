import { PlayerProfileNew } from "@/components/player-profile-new";
import { PlayerProfileSkeleton } from "@/components/ui/loading-skeleton";
import { DanConfig } from "@/lib/game-helpers-client";
import { Suspense } from "react";

export const dynamic = "force-dynamic"; // o config de revalidate si querés caching

async function getInitialData(legajo: number) {
  try {
    // Ideal: llamar servicios/DB directo. Si no, podés usar tus APIs internas.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const [profileRes, cacheRes] = await Promise.all([
      fetch(`${baseUrl}/api/players/${legajo}/profile`, {
        cache: "no-store",
        headers: {
          'Cache-Control': 's-maxage=10, stale-while-revalidate=30'
        }
      }),
      fetch(`${baseUrl}/api/config/cache`, {
        next: { revalidate: 3600 },
        cache: "force-cache"
      })
    ]);

    if (!profileRes.ok) {
      throw new Error(`Profile fetch failed: ${profileRes.status}`);
    }

    const profile = await profileRes.json();
    const cfg = await cacheRes.json();

    const dan: DanConfig[] = cfg?.data?.dan ?? [];
    return {
      ...profile,
      danConfigsYonma: dan.filter((d: any) => !d.sanma),
      danConfigsSanma: dan.filter((d: any) => d.sanma),
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return null;
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ legajo: string }>;
}): Promise<JSX.Element> {
  const { legajo } = await params;
  const legajoNumber = parseInt(legajo);

  if (isNaN(legajoNumber)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-red-600 text-xl">Legajo inválido</div>
      </main>
    );
  }

  const initial = await getInitialData(legajoNumber);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<PlayerProfileSkeleton />}>
        <PlayerProfileNew legajo={legajoNumber} initial={initial} />
      </Suspense>
    </main>
  );
}
