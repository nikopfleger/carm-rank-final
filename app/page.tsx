"use client";

import { useI18nContext } from "@/components/providers/i18n-provider";
import { RankTableNew } from "@/components/rank-table-new";
import { Card, CardContent } from "@/components/ui/card";
import { unifiedStyles } from "@/components/ui/unified-styles";
import Image from "next/image";
import { Suspense } from "react";
import styles from "./page.module.css";

export default function Home() {
  const { t } = useI18nContext();

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          {/* Logo + Title Group */}
          <div className={styles.logoTitleGroup}>
            <div className={styles.logoContainer}>
              <Image
                src="/carm-logo.png"
                alt="Logo del Club Argentino de Riichi Mahjong (CARM)"
                width={56}
                height={56}
                quality={95}
                priority
                sizes="56px"
                draggable={false}
                className={styles.logoImage}
              />
            </div>
            <h1 className={styles.title}>
              <span className={styles.titleMain}>Ranking </span>
              <span className={styles.titleSub}>CARM</span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className={styles.subtitle}>{t("home.title")}</p>

          {/* Decorative Line */}
          <div className={styles.decorativeLine}>
            <div className={styles.lineCenter} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {/* Season Info */}
        <div className="mb-8">
          <Card className={unifiedStyles.card}>
            <CardContent className="pt-6">
              <p className="text-center text-gray-700 dark:text-gray-300">
                {t("home.description")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ranking Table */}
        <Suspense fallback={<div className="text-center py-8">Cargando ranking...</div>}>
          <RankTableNew />
        </Suspense>
      </div>
    </div>
  );
}
