"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Award,
  BarChart,
  Building2,
  Calendar,
  Database,
  Globe,
  Link as LinkIcon,
  Mail,
  Settings,
  Trophy,
  UserCheck,
  Users
} from "lucide-react";
import Link from "next/link";
import React from "react";
import styles from "./page.module.css";

interface ABMItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function ABMPage() {
  const { t } = useI18nContext();

  const abmItems: ABMItem[] = [
    {
      title: t('abm.countries', 'Países'),
      description: "Administrar países y nacionalidades",
      href: "/admin/abm/countries",
      icon: Globe,
      color: "bg-red-500"
    },
    {
      title: t('abm.locations', 'Ubicaciones'),
      description: "Gestionar ubicaciones y lugares de juego",
      href: "/admin/abm/locations",
      icon: Building2,
      color: "bg-cyan-500"
    },
    {
      title: t('abm.players', 'Jugadores'),
      description: "Gestionar jugadores del sistema",
      href: "/admin/abm/players",
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: t('abm.uma', 'UMA'),
      description: "Configurar sistemas de puntuación UMA",
      href: "/admin/abm/uma",
      icon: Award,
      color: "bg-yellow-500"
    },
    {
      title: t('abm.seasons', 'Temporadas'),
      description: "Administrar temporadas de juego",
      href: "/admin/abm/seasons",
      icon: Calendar,
      color: "bg-purple-500"
    },
    {
      title: t('abm.tournaments', 'Torneos'),
      description: "Gestionar torneos y competencias",
      href: "/admin/abm/tournaments",
      icon: Trophy,
      color: "bg-red-500"
    },
    {
      title: t('abm.rulesets', 'Reglas'),
      description: "Configurar reglas de juego",
      href: "/admin/abm/rulesets",
      icon: Settings,
      color: "bg-gray-500"
    },
    {
      title: t('abm.tournamentResults', 'Resultados de Torneos'),
      description: "Gestionar resultados de torneos",
      href: "/admin/abm/tournament-results",
      icon: Database,
      color: "bg-pink-500"
    },
    {
      title: t('abm.seasonResults', 'Resultados de Temporadas'),
      description: "Ver y editar resultados finales de temporadas",
      href: "/admin/abm/season-results",
      icon: BarChart,
      color: "bg-indigo-500"
    },
    {
      title: t('abm.users', 'Usuarios'),
      description: "Gestionar usuarios y permisos del sistema",
      href: "/admin/abm/users",
      icon: UserCheck,
      color: "bg-blue-500"
    },
    {
      title: t('abm.emailAccounts', 'Casillas de Email'),
      description: "Configurar cuentas de email para notificaciones",
      href: "/admin/abm/email-accounts",
      icon: Mail,
      color: "bg-cyan-500"
    },
    {
      title: t('abm.linkRequests', 'Solicitudes de Vinculación'),
      description: "Gestionar solicitudes de vinculación usuario-jugador",
      href: "/admin/abm/link-requests",
      icon: LinkIcon,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className={styles.abmPage}>
      <div className={styles.abmHeader}>
        <h1 className={styles.abmTitle}>
          Administración de Datos Maestros (ABM)
        </h1>
        <p className={styles.abmDescription}>
          Gestiona todos los datos maestros del sistema de manera centralizada
        </p>
      </div>

      <div className={styles.abmGrid}>
        {abmItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className={styles.abmCard}>
                <CardHeader className={styles.abmCardHeader}>
                  <div className={styles.abmCardIcon}>
                    <div className={`${styles.abmIconContainer} ${item.color}`}>
                      <Icon className={styles.abmIcon} />
                    </div>
                    <CardTitle className={styles.abmCardTitle}>{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={styles.abmCardContent}>
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className={styles.abmInfo}>
        <h3 className={styles.abmInfoTitle}>
          Características del Sistema ABM
        </h3>
        <ul className={`${styles.abmInfoText} space-y-1`}>
          <li>• <strong>Versionado automático:</strong> Cada cambio incrementa la versión del registro</li>
          <li>• <strong>Borrado lógico:</strong> Los registros se marcan como eliminados, no se borran físicamente</li>
          <li>• <strong>Auditoría completa:</strong> Timestamps de creación y modificación automáticos</li>
          <li>• <strong>Búsqueda y filtrado:</strong> Encuentra registros rápidamente</li>
          <li>• <strong>Validación de datos:</strong> Campos requeridos y formatos validados</li>
        </ul>
      </div>
    </div>
  );
}
