import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./database/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "database" }, // 🔑 Cambio clave: database sessions
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    access_type: "offline",
                    prompt: "consent",   // al menos la 1ª vez para que Google entregue refresh_token
                },
            },
        }),
    ],
    trustHost: true,
    secret: process.env.NEXTAUTH_SECRET, // Asegurar el mismo secret en todos los runtimes

    // En NextAuth v5, la detección de URL es automática con trustHost: true
    // No necesitamos configurar 'url' manualmente
    callbacks: {
        async session({ session, user }) {
            if (session.user && user) {
                session.user.id = user.id;
                session.user.role = (user as any).role ?? null;
                session.user.authorities = (user as any).authorities ?? [];
                session.user.isActive = (user as any).isActive ?? true;
            }
            return session;
        },
        async signIn({ user, account }) {
            if (account?.provider !== "google" || !user.email) return false;

            const existing = await prisma.user.findUnique({
                where: { email: user.email.toLowerCase() },
                select: { isActive: true },
            });

            if (existing && !existing.isActive) return false;
            return true;
        },
    },
    events: {
        // Evento que se ejecuta cuando PrismaAdapter crea un nuevo usuario
        async createUser({ user }) {
            console.log('🆕 Nuevo usuario creado por PrismaAdapter:', user.email);

            // Asignar role y authorities por defecto
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: "USER",
                    authorities: [],
                    isActive: true,
                }
            });

            console.log('✅ Role y authorities asignados a:', user.email);
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    // session strategy ya está definido arriba como "database"
    // maxAge se maneja automáticamente con database sessions
    cookies: {
        pkceCodeVerifier: {
            name: "next-auth.pkce.code_verifier",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                maxAge: 900, // 15 minutos
            },
        },
        // Mejorar manejo de cookies de sesión
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? "__Secure-authjs.session-token"
                : "authjs.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    debug: process.env.NODE_ENV === "development",
});
