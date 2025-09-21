import { PlayerProfileNew } from "@/components/player-profile-new";

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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PlayerProfileNew legajo={legajoNumber} />
    </main>
  );
}
