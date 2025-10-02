'use client';

import { useI18nContext } from "@/components/providers/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatYmdForDisplay, toYmd } from '@/lib/format-utils';
import { Calendar, CheckCircle, Globe, Link2, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface PlayerInfoProps {
    player: {
        id: number;
        nickname: string;
        fullname?: string;
        birthday?: string;
        country?: {
            fullName: string;
            isoCode: string;
        };
        isActive: boolean;
        onlineUsers: Array<{
            platform: string;
            username: string;
            idOnline?: string;
        }>;
    };
    isLinked?: boolean;
    onLinkRequest?: () => void;
    isLinkRequestPending?: boolean;
}

export function PlayerInfo({
    player,
    isLinked = false,
    onLinkRequest,
    isLinkRequestPending = false
}: PlayerInfoProps) {
    const { t } = useI18nContext();
    const { data: session } = useSession();
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [linkNote, setLinkNote] = useState("");

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return formatYmdForDisplay(toYmd(date as any), 'es-AR');
        } catch {
            return dateString;
        }
    };

    const handleLinkRequest = () => {
        if (onLinkRequest) {
            onLinkRequest();
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                            {player.nickname.charAt(0).toUpperCase()}
                        </div>
                        {player.isActive && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                            <h1 className="text-2xl font-bold text-foreground">
                                {player.nickname}
                            </h1>
                            <Badge variant={player.isActive ? "default" : "secondary"}>
                                {player.isActive ? t("player.profilePage.active", "Activo") : t("player.profilePage.inactive", "Inactivo")}
                            </Badge>
                        </div>

                        {/* Country */}
                        {player.country && (
                            <div className="flex items-center space-x-2 mb-3">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {player.country.fullName} ({player.country.isoCode})
                                </span>
                            </div>
                        )}

                        {/* Full Name */}
                        {player.fullname && (
                            <div className="flex items-center space-x-2 mb-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {player.fullname}
                                </span>
                            </div>
                        )}

                        {/* Birthday */}
                        {player.birthday && (
                            <div className="flex items-center space-x-2 mb-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(player.birthday)}
                                </span>
                            </div>
                        )}

                        {/* Online Accounts */}
                        {player.onlineUsers && player.onlineUsers.length > 0 && (
                            <div className="mt-3">
                                <h3 className="text-sm font-medium text-foreground mb-2">
                                    {t("player.profilePage.onlineAccounts")}:
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {player.onlineUsers.map((account, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {account.platform}: {account.username}
                                            {account.idOnline && ` (${account.idOnline})`}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Link Status/Actions */}
                <div className="flex flex-col items-end space-y-2">
                    {isLinked ? (
                        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {t("player.profilePage.youAreLinked")}
                            </span>
                        </div>
                    ) : session?.user ? (
                        <div className="flex flex-col items-end space-y-2">
                            {!showLinkForm ? (
                                <Button
                                    onClick={() => setShowLinkForm(true)}
                                    size="sm"
                                    className="flex items-center space-x-2"
                                >
                                    <Link2 className="w-4 h-4" />
                                    <span>{t("player.profilePage.linkPlayer")}</span>
                                </Button>
                            ) : (
                                <div className="flex flex-col items-end space-y-2">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {t("player.profilePage.linkPlayerConfirm")}
                                        </p>
                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={handleLinkRequest}
                                                disabled={isLinkRequestPending}
                                                size="sm"
                                                variant="default"
                                            >
                                                {isLinkRequestPending
                                                    ? t("player.profilePage.sendingRequest")
                                                    : t("player.profilePage.sendRequest")
                                                }
                                            </Button>
                                            <Button
                                                onClick={() => setShowLinkForm(false)}
                                                size="sm"
                                                variant="outline"
                                            >
                                                {t("common.cancel")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </Card>
    );
}
