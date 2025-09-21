'use client';

import { useI18nContext } from '@/components/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { unifiedStyles } from '@/components/ui/unified-styles';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useState } from 'react';

interface EditPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerData: {
        nickname: string;
        fullname?: string;
        country?: string;
        birthday?: string;
    };
    onSave: (data: {
        fullname?: string;
        country?: string;
        birthday?: string;
    }) => Promise<void>;
    submitting?: boolean;
}

export function EditPlayerModal({
    isOpen,
    onClose,
    playerData,
    onSave,
    submitting = false
}: EditPlayerModalProps) {
    const { t } = useI18nContext();
    const { handleSuccess, handleError } = useErrorHandler();

    // Array de países para el Select (usando códigos ISO de 3 letras como en la BD)
    const countries = [
        { value: 'ARG', label: t('countries.ARG', 'Argentina') },
        { value: 'BRA', label: t('countries.BRA', 'Brasil') },
        { value: 'CHI', label: t('countries.CHI', 'Chile') },
        { value: 'COL', label: t('countries.COL', 'Colombia') },
        { value: 'MEX', label: t('countries.MEX', 'México') },
        { value: 'PER', label: t('countries.PER', 'Perú') },
        { value: 'URU', label: t('countries.URU', 'Uruguay') },
        { value: 'VEN', label: t('countries.VEN', 'Venezuela') },
        { value: 'USA', label: t('countries.USA', 'Estados Unidos') },
        { value: 'CAN', label: t('countries.CAN', 'Canadá') },
        { value: 'ESP', label: t('countries.ESP', 'España') },
        { value: 'FRA', label: t('countries.FRA', 'Francia') },
        { value: 'GER', label: t('countries.GER', 'Alemania') },
        { value: 'ITA', label: t('countries.ITA', 'Italia') },
        { value: 'JPN', label: t('countries.JPN', 'Japón') },
        { value: 'KOR', label: t('countries.KOR', 'Corea del Sur') },
        { value: 'CHN', label: t('countries.CHN', 'China') },
        { value: 'AUS', label: t('countries.AUS', 'Australia') },
        { value: 'NZL', label: t('countries.NZL', 'Nueva Zelanda') },
        { value: 'GBR', label: t('countries.GBR', 'Reino Unido') },
        { value: 'RUS', label: t('countries.RUS', 'Rusia') },
        { value: 'IND', label: t('countries.IND', 'India') },
        { value: 'OTHER', label: t('countries.OTHER', 'Otro') }
    ];

    const [formData, setFormData] = useState({
        fullname: playerData.fullname || '',
        country: playerData.country || 'ARG',
        birthday: playerData.birthday ? new Date(playerData.birthday).toISOString().split('T')[0] : ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (formData.fullname && formData.fullname.trim().length < 2) {
            newErrors.fullname = t("player.profilePage.nameMinLength");
        }

        if (formData.birthday) {
            const birthDate = new Date(formData.birthday);
            const today = new Date();
            if (birthDate > today) {
                newErrors.birthday = t("player.profilePage.futureBirthDate");
            }
            if (birthDate < new Date('1900-01-01')) {
                newErrors.birthday = t("player.profilePage.invalidBirthDate");
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            await onSave({
                fullname: formData.fullname.trim() || undefined,
                country: formData.country || undefined,
                birthday: formData.birthday || undefined
            });

            handleSuccess(
                t("player.profilePage.profileupdatedAtDescription"),
                t("player.profilePage.profileupdatedAt")
            );

            onClose();
        } catch (error) {
            handleError(error, t('player.profilePage.editProfile'));
        }
    };

    const handleClose = () => {
        setFormData({
            fullname: playerData.fullname || '',
            country: playerData.country || 'ARG',
            birthday: playerData.birthday ? new Date(playerData.birthday).toISOString().split('T')[0] : ''
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("player.profilePage.editProfile")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Nombre completo */}
                    <div className="space-y-2">
                        <Label htmlFor="fullname">{t("player.profilePage.fullName")}</Label>
                        <Input
                            id="fullname"
                            value={formData.fullname}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullname: e.target.value }))}
                            placeholder={t("player.profilePage.fullNamePlaceholder")}
                        />
                        {errors.fullname && (
                            <p className="text-sm text-destructive">{errors.fullname}</p>
                        )}
                    </div>

                    {/* País */}
                    <div className="space-y-2">
                        <Label htmlFor="country">{t("player.profilePage.country")}</Label>
                        <Select
                            value={formData.country}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                        >
                            <SelectTrigger>
                                <span className="flex-1 text-left">
                                    {countries.find(c => c.value === formData.country)?.label || t("player.profilePage.selectCountry")}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map((country) => (
                                    <SelectItem key={country.value} value={country.value}>
                                        {country.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fecha de nacimiento */}
                    <div className="space-y-2">
                        <Label htmlFor="birthday">{t("player.profilePage.birthDate")}</Label>
                        <Input
                            id="birthday"
                            type="date"
                            value={formData.birthday}
                            onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                        />
                        {errors.birthday && (
                            <p className="text-sm text-destructive">{errors.birthday}</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button className={unifiedStyles.secondaryButton} onClick={handleClose} disabled={submitting}>
                        {t("player.profilePage.cancel")}
                    </Button>
                    <Button className={unifiedStyles.primaryButton} onClick={handleSave} disabled={submitting}>
                        {submitting ? t("player.profilePage.saving") : t("player.profilePage.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
