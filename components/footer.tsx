'use client';

import { useI18nContext } from '@/components/providers/i18n-provider';
import { Facebook, Instagram, Linkedin, MessageCircle, Twitch, Twitter } from 'lucide-react';
import Image from 'next/image';
import styles from './footer.module.css';

export function Footer() {
    const { t } = useI18nContext();

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerGrid}>
                    {/* Información del Club */}
                    <div className={styles.footerSection}>
                        <div className={styles.footerTitleWithLogo}>
                            <div className={styles.footerLogo}>
                                <Image
                                    src="/carm-logo.png"
                                    alt="CARM Logo"
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-contain"
                                    priority={false}
                                    sizes="24px"
                                />
                            </div>
                            <h3 className={styles.footerTitle}>
                                {t('home.brand')}
                            </h3>
                        </div>
                        <p className={styles.footerDescription}>
                            {t('home.description')}
                        </p>
                    </div>

                    {/* Redes Sociales */}
                    <div className={styles.footerSectionCenter}>
                        <h3 className={styles.footerTitle}>
                            {t('home.followUs')}
                        </h3>
                        <div className={styles.socialLinks}>
                            <a
                                href="https://www.facebook.com/ClubArgentinoDeMahjong"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.socialLink} ${styles.socialLinkFacebook}`}
                                title="Facebook"
                            >
                                <Facebook className="w-6 h-6" />
                            </a>
                            <a
                                href="https://www.instagram.com/carm.arg"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.socialLink} ${styles.socialLinkInstagram}`}
                                title="Instagram"
                            >
                                <Instagram className="w-6 h-6" />
                            </a>
                            <a
                                href="https://www.linkedin.com/company/33259811/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.socialLink} ${styles.socialLinkLinkedin}`}
                                title="LinkedIn"
                            >
                                <Linkedin className="w-6 h-6" />
                            </a>
                            <a
                                href="https://x.com/camriichi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.socialLink} ${styles.socialLinkTwitter}`}
                                title="X (Twitter)"
                            >
                                <Twitter className="w-6 h-6" />
                            </a>
                            <a
                                href="http://twitch.tv/carmahjong"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.socialLink} ${styles.socialLinkTwitch}`}
                                title="Twitch"
                            >
                                <Twitch className="w-6 h-6" />
                            </a>
                            <a
                                href="https://discord.gg/Z4kN9fbERm"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.socialLink} ${styles.socialLinkDiscord}`}
                                title="Discord"
                            >
                                <MessageCircle className="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    {/* Créditos */}
                    <div className={styles.footerSectionRight}>
                        <h3 className={styles.footerTitle}>
                            {t('home.credits')}
                        </h3>
                        <p className={styles.creditsText}>
                            {t('home.logoDesigner')}{" "}
                            <a
                                href="https://www.linkedin.com/in/patrick-du-b7271285/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.creditsLink}
                            >
                                Patrick Du
                            </a>
                        </p>
                    </div>
                </div>

                {/* Copyright */}
                <div className={styles.copyrightSection}>
                    <div className={styles.copyrightText}>
                        <p>{t('home.copyright')}</p>
                        <p className={styles.copyrightDate}>
                            {t('home.lastUpdate')}: {new Date().toLocaleDateString('es-AR')}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}