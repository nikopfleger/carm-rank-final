import { prisma } from '@/lib/database/client';
import { NextRequest, NextResponse } from 'next/server';

;

function getOwnerWhitelist(): Set<string> {
  const email = process.env.OWNER_EMAIL || "";

  if (email) {
    return new Set([email.trim().toLowerCase()]);
  }

  return new Set();
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const emailLc = String(email).toLowerCase();
    const owners = getOwnerWhitelist();

    // Verificar si el usuario ya existe
    let user = await prisma.user.findUnique({
      where: { email: emailLc },
    });

    if (!user) {
      // Crear usuario: si está en whitelist => OWNER; si no => USER
      const role = owners.has(emailLc) ? "OWNER" : "USER";
      const authorities = owners.has(emailLc) ? ["*"] : ["READ"];
      user = await prisma.user.create({
        data: {
          email: emailLc,
          name,
          role,
          authorities,
          isActive: true,
        },
      });
      console.log(`Usuario ${emailLc} creado como ${role}`);
    } else {
      // Usuario existente: si está en whitelist y no es OWNER, promover
      if (owners.has(emailLc) && user.role !== "OWNER") {
        user = await prisma.user.update({
          where: { email: emailLc },
          data: { role: "OWNER", authorities: ["*"], isActive: true },
        });
        console.log(`Usuario ${emailLc} promovido a OWNER (whitelist)`);
      } else {
        console.log(`Usuario existente ${emailLc} - acceso permitido`);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        authorities: user.authorities,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error verificando/creando usuario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
