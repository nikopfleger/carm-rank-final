import { prisma } from "@/lib/database/client";
import { NextRequest, NextResponse } from "next/server";

function getOwnerWhitelist(): Set<string> {
  const email = process.env.OWNER_EMAIL || "";

  if (email) {
    return new Set([email.trim().toLowerCase()]);
  }

  return new Set();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const emailLc = String(email).toLowerCase();
    const owners = getOwnerWhitelist();

    if (owners.has(emailLc)) {
      await prisma.user.upsert({
        where: { email: emailLc },
        update: {
          role: "OWNER",
          authorities: ["*"],
          isActive: true,
        },
        create: {
          email: emailLc,
          role: "OWNER",
          authorities: ["*"],
          isActive: true,
        },
      });
      console.log(`Usuario ${emailLc} configurado como OWNER (whitelist)`);
      return NextResponse.json({ role: "OWNER" });
    } else {
      await prisma.user.upsert({
        where: { email: emailLc },
        update: {
          role: "USER",
          authorities: ["READ"],
          isActive: true,
        },
        create: {
          email: emailLc,
          role: "USER",
          authorities: ["READ"],
          isActive: true,
        },
      });
      console.log(`Usuario ${emailLc} configurado como USER normal`);
      return NextResponse.json({ role: "USER" });
    }
  } catch (error) {
    console.error("Error asignando rol:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
