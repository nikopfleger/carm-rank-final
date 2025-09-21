"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HealthStatus {
    status: 'ok' | 'error';
    service?: string;
    heartbeat?: boolean;
    timestamp: string;
    uptime?: number;
    memory?: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
    version?: string;
    environment?: string;
    error?: string;
}

export function ServerMonitor() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    const checkHealth = async () => {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            setHealth(data);
            setLastCheck(new Date());
        } catch (error) {
            setHealth({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            setLastCheck(new Date());
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Check immediately
        checkHealth();

        // Check every 30 seconds
        const interval = setInterval(checkHealth, 30000);

        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <Card className="w-64">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 animate-pulse text-gray-400" />
                        <span className="text-sm text-gray-500">Checking server...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!health) return null;

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const formatMemory = (bytes: number) => {
        const mb = bytes / 1024 / 1024;
        return `${mb.toFixed(1)} MB`;
    };

    return (
        <Card className="w-64">
            <CardContent className="p-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {health.status === 'ok' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium">Heartbeat</span>
                        </div>
                        <Badge variant={health.status === 'ok' ? 'default' : 'destructive'}>
                            {health.status.toUpperCase()}
                        </Badge>
                    </div>

                    {health.status === 'ok' && (
                        <>
                            {health.uptime && (
                                <div className="text-xs text-gray-600">
                                    <strong>Uptime:</strong> {formatUptime(health.uptime)}
                                </div>
                            )}

                            {health.memory && (
                                <div className="text-xs text-gray-600">
                                    <strong>Memory:</strong> {formatMemory(health.memory.heapUsed)} / {formatMemory(health.memory.heapTotal)}
                                </div>
                            )}

                            {health.version && (
                                <div className="text-xs text-gray-600">
                                    <strong>Version:</strong> {health.version}
                                </div>
                            )}

                            {health.heartbeat !== undefined && (
                                <div className="text-xs text-gray-600">
                                    <strong>Heartbeat:</strong> {health.heartbeat ? '✅ Active' : '❌ Inactive'}
                                </div>
                            )}
                        </>
                    )}

                    {health.status === 'error' && health.error && (
                        <div className="text-xs text-red-600">
                            <strong>Error:</strong> {health.error}
                        </div>
                    )}

                    {lastCheck && (
                        <div className="text-xs text-gray-400">
                            Last check: {lastCheck.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
