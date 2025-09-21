"use client";

export function MahjongPattern() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg
                className="w-full h-full opacity-10"
                viewBox="0 0 400 400"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    {/* Patrón de ficha de mahjong */}
                    <pattern
                        id="mahjong-tile"
                        x="0"
                        y="0"
                        width="80"
                        height="80"
                        patternUnits="userSpaceOnUse"
                    >
                        {/* Ficha de mahjong simplificada */}
                        <rect
                            x="10"
                            y="10"
                            width="60"
                            height="80"
                            rx="8"
                            ry="8"
                            fill="rgba(255, 255, 255, 0.1)"
                            stroke="rgba(255, 255, 255, 0.2)"
                            strokeWidth="1"
                        />
                        {/* Líneas internas de la ficha */}
                        <rect
                            x="20"
                            y="20"
                            width="40"
                            height="60"
                            rx="4"
                            ry="4"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="0.5"
                        />
                        {/* Símbolo central (círculo) */}
                        <circle
                            cx="40"
                            cy="50"
                            r="8"
                            fill="rgba(255, 255, 255, 0.2)"
                        />
                        {/* Puntos decorativos */}
                        <circle cx="30" cy="30" r="1" fill="rgba(255, 255, 255, 0.4)" />
                        <circle cx="50" cy="30" r="1" fill="rgba(255, 255, 255, 0.4)" />
                        <circle cx="30" cy="70" r="1" fill="rgba(255, 255, 255, 0.4)" />
                        <circle cx="50" cy="70" r="1" fill="rgba(255, 255, 255, 0.4)" />
                    </pattern>

                    {/* Patrón de ficha más pequeña */}
                    <pattern
                        id="mahjong-tile-small"
                        x="0"
                        y="0"
                        width="60"
                        height="60"
                        patternUnits="userSpaceOnUse"
                    >
                        <rect
                            x="5"
                            y="5"
                            width="50"
                            height="60"
                            rx="6"
                            ry="6"
                            fill="rgba(255, 255, 255, 0.08)"
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth="0.5"
                        />
                        <circle
                            cx="30"
                            cy="35"
                            r="6"
                            fill="rgba(255, 255, 255, 0.15)"
                        />
                    </pattern>
                </defs>

                {/* Aplicar los patrones */}
                <rect width="100%" height="100%" fill="url(#mahjong-tile)" />
                <rect width="100%" height="100%" fill="url(#mahjong-tile-small)" />
            </svg>
        </div>
    );
}
