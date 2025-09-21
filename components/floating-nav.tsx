"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { CompactLanguageSelector } from "@/components/shared/language-selector";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
    Award,
    BarChart3,
    Bell,
    BookOpen,
    Calendar,
    CheckSquare,
    Database,
    Globe,
    History,
    LayoutDashboard,
    Link as LinkIcon,
    LogIn,
    LogOut,
    Mail,
    MapPin,
    Menu,
    Plus,
    Settings,
    Shield,
    Trophy,
    User,
    UserCheck,
    Users,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./floating-nav.module.css";

// Hook para manejar el onboarding
const useOnboarding = () => {
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem("carm-onboarding-seen");
        if (seen) {
            setHasSeenOnboarding(true);
            return;
        }
        const timer = setTimeout(() => setShowOnboarding(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    const dismissOnboarding = () => {
        setShowOnboarding(false);
        setHasSeenOnboarding(true);
        localStorage.setItem("carm-onboarding-seen", "true");
    };

    const resetOnboarding = () => {
        localStorage.removeItem("carm-onboarding-seen");
        setHasSeenOnboarding(false);
        setShowOnboarding(true);
    };

    return { showOnboarding, hasSeenOnboarding, dismissOnboarding, resetOnboarding };
};

export function FloatingNav() {
    const pathname = usePathname();
    const { session, isAuthenticated, isAdmin, logout } = useAuth();
    const { t } = useI18nContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const { showOnboarding, hasSeenOnboarding, dismissOnboarding, resetOnboarding } = useOnboarding();

    type NavItem = {
        name: string;
        href: string;
        icon: React.ComponentType<{ className?: string }>;
        color: string;
        description: string;
    };

    const isInAdmin = showAdminMenu;

    const navItems = useMemo<NavItem[]>(
        () => [
            {
                name: t("navigation.ranking", "Ranking"),
                href: `/`,
                icon: Trophy,
                color: "from-yellow-400 to-orange-500",
                description: t("navigation.ranking", "Ver clasificación de jugadores"),
            },
            {
                name: t("navigation.tournaments"),
                href: `/tournaments`,
                icon: Award,
                color: "from-blue-400 to-purple-500",
                description: t("navigation.tournaments", "Explorar torneos"),
            },
            {
                name: t("navigation.seasons"),
                href: `/seasons`,
                icon: Calendar,
                color: "from-green-400 to-teal-500",
                description: t("navigation.seasons", "Ver temporadas"),
            },
            {
                name: t("navigation.history"),
                href: `/history`,
                icon: History,
                color: "from-purple-400 to-pink-500",
                description: t("navigation.history", "Historial de juegos"),
            },
            {
                name: t("navigation.danSystem", "Sistema Dan"),
                href: `/reference/dan-system`,
                icon: BookOpen,
                color: "from-indigo-400 to-blue-500",
                description: t("navigation.danSystem", "Información del sistema"),
            },
        ],
        [t]
    );

    const adminMainItems = useMemo<NavItem[]>(
        () => [
            {
                name: t("admin.dashboard", "Dashboard"),
                href: `/admin`,
                icon: LayoutDashboard,
                color: "from-blue-400 to-indigo-500",
                description: t("admin.dashboardDescription", "Panel principal de administración"),
            },
            {
                name: t("admin.submitGame", "Ingresar Juego"),
                href: `/admin/games/submit`,
                icon: Plus,
                color: "from-green-400 to-emerald-500",
                description: t("admin.submitGame", "Ingresar nuevos resultados"),
            },
            {
                name: t("admin.validateGame", "Validar Juegos"),
                href: `/admin/games/validate`,
                icon: CheckSquare,
                color: "from-orange-400 to-red-500",
                description: t("admin.validateDescription", "Aprobar juegos pendientes"),
            },
            {
                name: t("admin.statistics", "Estadísticas"),
                href: `/admin/statistics`,
                icon: BarChart3,
                color: "from-purple-400 to-pink-500",
                description: t("admin.statisticsDescription", "Analytics y reportes"),
            },
        ],
        [t]
    );

    const adminABMItems = useMemo<NavItem[]>(
        () => [
            { name: t("abm.countries", "Países"), href: `/admin/abm/countries`, icon: Globe, color: "from-cyan-400 to-blue-500", description: t("abm.countries", "Administrar países") },
            { name: t("abm.locations", "Ubicaciones"), href: `/admin/abm/locations`, icon: MapPin, color: "from-lime-400 to-emerald-500", description: t("abm.locations", "Administrar ubicaciones") },
            { name: t("abm.players", "Jugadores"), href: `/admin/abm/players`, icon: Users, color: "from-emerald-400 to-green-500", description: t("abm.players", "Gestionar jugadores") },
            { name: t("abm.uma", "UMA"), href: `/admin/abm/uma`, icon: Award, color: "from-yellow-400 to-orange-500", description: t("abm.uma", "Administrar UMA") },
            { name: t("admin.rateConfigs", "Config Rate"), href: `/admin/abm/rate-configs`, icon: Settings, color: "from-slate-400 to-gray-500", description: t("admin.rateConfigsDescription", "Configurar Rate") },
            { name: t("admin.danConfigs", "Config Dan"), href: `/admin/abm/dan-configs`, icon: Award, color: "from-amber-400 to-yellow-500", description: t("admin.danConfigsDescription", "Configurar Dan") },
            { name: t("admin.seasonConfigs", "Config Temporadas"), href: `/admin/abm/season-configs`, icon: Calendar, color: "from-teal-400 to-cyan-500", description: t("admin.seasonConfigsDescription", "Configurar Temporadas") },
            { name: t("abm.seasons", "Temporadas"), href: `/admin/abm/seasons`, icon: Calendar, color: "from-green-400 to-teal-500", description: t("abm.seasons", "Administrar temporadas") },
            { name: t("abm.tournaments", "Torneos"), href: `/admin/abm/tournaments`, icon: Trophy, color: "from-violet-400 to-purple-500", description: t("abm.tournaments", "Administrar torneos") },
            { name: t("abm.rulesets", "Reglas"), href: `/admin/abm/rulesets`, icon: Settings, color: "from-gray-400 to-slate-500", description: t("abm.rulesets", "Administrar reglas") },
            { name: t("abm.tournamentResults", "Resultados Torneos"), href: `/admin/abm/tournament-results`, icon: Database, color: "from-indigo-400 to-blue-500", description: t("abm.tournamentResults", "Administrar resultados") },
            { name: t("abm.seasonResults", "Resultados Temporadas"), href: `/admin/abm/season-results`, icon: BarChart3, color: "from-emerald-400 to-green-500", description: t("abm.seasonResults", "Ver y editar resultados de temporadas") },
            { name: t("abm.users", "Usuarios"), href: `/admin/abm/users`, icon: UserCheck, color: "from-rose-400 to-pink-500", description: t("abm.users", "Gestionar usuarios del sistema") },
            { name: t("abm.emailAccounts", "Casillas de Email"), href: `/admin/abm/email-accounts`, icon: Mail, color: "from-orange-400 to-red-500", description: t("abm.emailAccounts", "Configurar cuentas de email") },
            { name: "Notificaciones Email", href: `/admin/email-notifications`, icon: Bell, color: "from-purple-400 to-pink-500", description: "Configurar notificaciones por email" },
            { name: t("abm.linkRequests", "Solicitudes de Vinculación"), href: `/admin/abm/link-requests`, icon: LinkIcon, color: "from-sky-400 to-cyan-500", description: t("abm.linkRequests", "Gestionar solicitudes de vinculación") },
        ],
        [t]
    );

    useEffect(() => {
        setIsOpen(false);
        setIsExpanded(false);
    }, [pathname]);

    useEffect(() => {
        if (!isOpen) setShowAdminMenu(false);
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
                setIsExpanded(false);
            }
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [isOpen]);

    const toggleNav = () => {
        if (showOnboarding) dismissOnboarding();
        if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => setIsExpanded(true), 100);
        } else {
            setIsExpanded(false);
            setTimeout(() => setIsOpen(false), 300);
        }
    };

    const handleFabClick = () => {
        setClickCount((prev) => prev + 1);
        setTimeout(() => setClickCount(0), 2000);
        if (clickCount === 1) {
            resetOnboarding();
            setClickCount(0);
        }
        toggleNav();
    };

    return (
        <>
            {/* Floating Action Button */}
            <div className={styles.fabContainer}>
                <button onClick={handleFabClick} className={cn(styles.fab, isOpen && styles.fabActive)} aria-label={t("ui.openNavigation", "Abrir menú de navegación")}>
                    {isOpen ? <X className="w-6 h-6 transition-transform duration-300" /> : <Menu className="w-6 h-6 transition-transform duration-300" />}
                </button>
            </div>

            {/* Onboarding Tooltip */}
            {showOnboarding && !hasSeenOnboarding && (
                <div className={styles.onboardingTooltip}>
                    <div className={styles.tooltipArrow} />
                    <div className={styles.tooltipContent}>
                        <div className={styles.tooltipIcon}>👆</div>
                        <div className={styles.tooltipText}>
                            <div className={styles.tooltipTitle}>{t("ui.welcome", "¡Bienvenido a CARM!")}</div>
                            <div className={styles.tooltipSubtitle}>{t("ui.welcomeSubtitle", "Toca aquí para explorar el menú y descubrir todas las funciones")}</div>
                        </div>
                        <button onClick={dismissOnboarding} className={styles.tooltipClose} aria-label={t("ui.close", "Cerrar")}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Overlay */}
            {isOpen && <div className={styles.overlay} onClick={() => { setIsExpanded(false); setTimeout(() => setIsOpen(false), 300); }} />}

            {/* Navigation Panel */}
            {isOpen && (
                <div className={cn(styles.navPanel, isExpanded && styles.navPanelExpanded)}>
                    {/* Header */}
                    <div className={styles.navHeader}>
                        <div className={styles.brandSection}>
                            <div className={styles.logoContainer}>
                                <Image src="/carm-logo.png" alt="CARM Logo" width={32} height={32} className="w-full h-full object-contain" priority={false} sizes="32px" />
                            </div>
                            <div className={styles.brandText}>
                                <div className={styles.brandTitle}>CARM</div>
                                <div className={styles.brandSubtitle}>Club Argentino de Riichi Mahjong</div>
                            </div>
                        </div>

                        {/* slot para el selector de idioma */}
                        <div className={styles.langSlot}>
                            <CompactLanguageSelector />
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <div className={styles.navItems}>
                        {isInAdmin ? (
                            <>
                                {adminMainItems.map((item, index) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href || (item.href !== `/admin` && pathname.startsWith(item.href));
                                    return (
                                        <Link key={item.name} href={item.href} className={cn(styles.navItem, isActive && styles.navItemActive)} style={{ animationDelay: `${index * 50}ms` }}>
                                            <div className={cn(styles.navItemIcon, `bg-gradient-to-r ${item.color}`, isActive && styles.navItemIconActive)}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className={styles.navItemContent}>
                                                <div className={styles.navItemName}>{item.name}</div>
                                                <div className={styles.navItemDescription}>{item.description}</div>
                                            </div>
                                            {isActive && <div className={styles.navItemIndicator} />}
                                        </Link>
                                    );
                                })}

                                <div className="border-t border-gray-600 my-4"></div>

                                <div className="text-xs font-semibold text-gray-400 mb-2 px-4">
                                    {t("admin.abm", "ABM")} - {t("admin.dashboard", "Administración")}
                                </div>

                                {adminABMItems.map((item, index) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(styles.navItem, isActive && styles.navItemActive)}
                                            style={{ animationDelay: `${(index + adminMainItems.length + 1) * 50}ms` }}
                                        >
                                            <div className={cn(styles.navItemIcon, `bg-gradient-to-r ${item.color}`, isActive && styles.navItemIconActive)}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className={styles.navItemContent}>
                                                <div className={styles.navItemName}>{item.name}</div>
                                                <div className={styles.navItemDescription}>{item.description}</div>
                                            </div>
                                            {isActive && <div className={styles.navItemIndicator} />}
                                        </Link>
                                    );
                                })}
                            </>
                        ) : (
                            navItems.map((item, index) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || (item.href !== `/` && pathname.startsWith(item.href));
                                return (
                                    <Link key={item.name} href={item.href} className={cn(styles.navItem, isActive && styles.navItemActive)} style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className={cn(styles.navItemIcon, `bg-gradient-to-r ${item.color}`, isActive && styles.navItemIconActive)}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className={styles.navItemContent}>
                                            <div className={styles.navItemName}>{item.name}</div>
                                            <div className={styles.navItemDescription}>{item.description}</div>
                                        </div>
                                        {isActive && <div className={styles.navItemIndicator} />}
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    {/* User Section */}
                    <div className={styles.userSection}>
                        {isAuthenticated ? (
                            <>
                                <div className={styles.userInfo}>
                                    <div className={styles.userAvatar}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className={styles.userDetails}>
                                        <div className={styles.userName}>{session?.user?.name || session?.user?.email}</div>
                                        {isAdmin() && (
                                            <div className={styles.adminBadge}>
                                                <Shield className="w-3 h-3" />
                                                {t("navigation.admin", "Admin")}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.userActions}>
                                    {isAdmin() && (
                                        <>
                                            {isInAdmin ? (
                                                <button onClick={() => setShowAdminMenu(false)} className={styles.adminLink}>
                                                    <Trophy className="w-4 h-4" />
                                                    {t("navigation.home", "Inicio")}
                                                </button>
                                            ) : (
                                                <button onClick={() => setShowAdminMenu(true)} className={styles.adminLink}>
                                                    <Shield className="w-4 h-4" />
                                                    {t("navigation.admin")}
                                                </button>
                                            )}
                                        </>
                                    )}
                                    <Button variant="outline" size="sm" onClick={logout} className={styles.logoutButton}>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        {t("navigation.signout")}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Link href="/auth/signin" className={styles.signInLink}>
                                <LogIn className="w-4 h-4 mr-2" />
                                {t("navigation.signin")}
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
