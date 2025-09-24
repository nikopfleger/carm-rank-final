import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlayerFormWithOnlineAccounts } from "./PlayerFormWithOnlineAccounts";

interface Country {
    id: number;
    name_es: string;
    iso_code: string;
}

interface PlayerFormModalProps {
    isOpen: boolean;
    onClose(): void;
    title: string;
    initialData?: any;
    countries: Country[];
    onSubmit(data: { player: any; onlineUsers: any[] }): void;
    validateNickname(value: string): Promise<string | null>;
    validateLegajo(value: number): Promise<string | null>;
    onRevertSubgrid?(revertFn: () => void): void;
}

export function PlayerFormModal({
    isOpen,
    onClose,
    title,
    initialData = {},
    countries,
    onSubmit,
    validateNickname,
    validateLegajo,
    onRevertSubgrid
}: PlayerFormModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    <PlayerFormWithOnlineAccounts
                        initialData={initialData}
                        countries={countries}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        validateNickname={validateNickname}
                        validateLegajo={validateLegajo}
                        showCard={false}
                        onRevertSubgrid={onRevertSubgrid}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
