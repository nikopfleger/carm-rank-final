"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { CompactLanguageSelector } from "@/components/shared/language-selector";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Award,
  BookOpen,
  Calendar,
  History,
  LogIn,
  LogOut,
  Shield,
  Trophy,
  User
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import styles from "./main-navigation.module.css";

export function MainNavigation() {
  const pathname = usePathname();
  const { session, isAuthenticated, isAdmin, logout } = useAuth();
  const { t, isClient } = useI18nContext();

  // Definir el tipo para los items de navegación
  type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };

  const navItems = useMemo<NavItem[]>(() => [
    {
      name: t('navigation.ranking', 'Ranking'),
      href: `/`,
      icon: Trophy
    },
    {
      name: t('navigation.tournaments'),
      href: `/tournaments`,
      icon: Award
    },
    {
      name: t('navigation.seasons'),
      href: `/seasons`,
      icon: Calendar
    },
    {
      name: t('navigation.history'),
      href: `/history`,
      icon: History
    },
    {
      name: t('navigation.danSystem', 'Sistema Dan'),
      href: `/reference/dan-system`,
      icon: BookOpen
    }
  ], [t]); // ✅ Dependencia en t e isClient para evitar hydration mismatch

  return (
    <nav className={styles.navigation}>
      <div className={styles.navContainer}>
        <div className={styles.navContent}>
          {/* Logo and Brand - Left Side */}
          <div className={styles.logoSection}>
            <Link href="/" className={styles.logoLink}>
              <div className={styles.logoIcon}>
                <Image
                  src="/carm-logo.png"
                  alt="CARM Logo"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className={styles.brandText}>Club Argentino de Riichi Mahjong</div>
              </div>
            </Link>

            {/* Language Selector - Right of Logo/Brand */}
            <div className="ml-4">
              <CompactLanguageSelector />
            </div>
          </div>

          {/* Navigation Links - Center */}
          <div className={styles.navLinks}>
            {navItems.map((item: NavItem) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== `/` && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    styles.navLink,
                    isActive ? styles.navLinkActive : styles.navLinkInactive
                  )}
                >
                  <Icon className={styles.navLinkIcon} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className={styles.rightActions}>
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className={styles.userInfo}>
                  <User className={styles.userIcon} />
                  <span className={styles.userName}>{session?.user?.name || session?.user?.email}</span>
                  {isAdmin() && (
                    <Shield className={styles.adminIcon} />
                  )}
                </div>

                {/* Admin Link */}
                {isAdmin() && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className={styles.adminButton}>
                      <Shield className="w-4 h-4 mr-1" />
                      {t('navigation.admin')}
                    </Button>
                  </Link>
                )}

                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className={styles.logoutButton}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  {t('navigation.signout')}
                </Button>
              </>
            ) : (
              /* Sign In Button */
              <Link href="/auth/signin">
                <Button variant="outline" size="sm" className={styles.logoutButton}>
                  <LogIn className="w-4 h-4 mr-1" />
                  {t('navigation.signin')}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item: NavItem) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== `/` && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-red-600 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
