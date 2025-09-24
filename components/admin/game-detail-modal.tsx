import { GameSheet } from "@/components/shared/game-sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle,
  Image as ImageIcon,
  MapPin,
  Users,
  X,
  XCircle
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface GameDetailModalProps {
  game: {
    id: number;
    gameDate: string;
    nroJuegoDia?: number;
    venue?: string;
    duration: string;
    sanma: boolean;
    seasonName?: string;
    imageUrl?: string;
    status: string;
    createdAt: string;
    ruleset: {
      id: number;
      name: string;
      inPoints: number;
      outPoints: number;
      oka: number;
      chonbo: number;
      uma: {
        firstPlace: number;
        secondPlace: number;
        thirdPlace: number;
        fourthPlace?: number;
      };
    };
    players: Array<{
      id: number;
      nickname: string;
      fullname?: string;
      wind?: string;
      oorasuScore?: number;
      gameScore: number;
      chonbos: number;
      finalScore?: number | null;
    }>;
  };
  isOpen: boolean;
  isFirstInOrder?: boolean;
  onClose(): void;
  onApprove(gameId: number): Promise<void>;
  onReject(gameId: number, reason: string): Promise<void>;
}

export function GameDetailModal({
  game,
  isOpen,
  isFirstInOrder = false,
  onClose,
  onApprove,
  onReject
}: GameDetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onApprove(game.id);
      onClose();
    } catch (error) {
      setError('Error al aprobar el juego');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('El motivo de rechazo es obligatorio');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      await onReject(game.id, rejectReason);
      onClose();
    } catch (error) {
      setError('Error al rechazar el juego');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (game.status) {
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case "VALIDATED":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Validado</Badge>;
      case "REJECTED":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl max-h-[90vh] overflow-y-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Detalle del Juego #{game.id}
              {game.nroJuegoDia && (
                <span className="text-lg font-normal text-gray-500 ml-2">
                  (Juego #{game.nroJuegoDia} del día)
                </span>
              )}
              {game.seasonName && (
                <span className="text-lg font-normal text-blue-600 ml-2">
                  • {game.seasonName}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(game.gameDate).toLocaleDateString('es-ES')}
              </div>
              {game.venue && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {game.venue}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {game.players.length} jugadores ({game.duration})
              </div>
              {game.imageUrl && (
                <div className="flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  Imagen adjunta
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Order Alert */}
          {game.status === 'PENDING' && (
            <Alert className={`mb-4 ${isFirstInOrder ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' : 'border-amber-200 bg-amber-50 dark:bg-amber-900/20'}`}>
              <AlertDescription>
                {isFirstInOrder ? (
                  <span className="text-blue-800 dark:text-blue-200">
                    ✅ Este juego está listo para ser procesado (primero en orden).
                  </span>
                ) : (
                  <span className="text-amber-800 dark:text-amber-200">
                    ⏳ Este juego debe esperar. Los juegos se procesan en orden por fecha y número de juego.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Game Sheet */}
          <div className="mb-6">
            <GameSheet
              players={game.players}
              ruleset={game.ruleset}
              sanma={game.sanma}
              readonly={true}
              showHeader={false}
            />
          </div>

          {/* Ruleset Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Información del Ruleset
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                <br />
                <span className="font-medium">{game.ruleset.name}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Puntos In/Out:</span>
                <br />
                <span className="font-medium">{game.ruleset.inPoints.toLocaleString()} / {game.ruleset.outPoints.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Oka:</span>
                <br />
                <span className="font-medium">{game.ruleset.oka}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Chonbo:</span>
                <br />
                <span className="font-medium">{game.ruleset.chonbo}</span>
              </div>
            </div>
          </div>

          {/* Image Preview */}
          {game.imageUrl && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Imagen de la Planilla
              </h3>
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <Image
                  src={game.imageUrl}
                  alt="Planilla del juego"
                  width={800}
                  height={600}
                  className="max-w-full h-auto rounded"
                  unoptimized
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.src = '/images/image-not-available.svg';
                  }}
                />
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && game.status === 'PENDING' && (
            <div className="mb-6 p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Rechazar Juego
              </h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Especifica el motivo del rechazo..."
                className="w-full p-3 border border-red-300 dark:border-red-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing || !rejectReason.trim()}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Confirmar Rechazo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason("");
                    setError(null);
                  }}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {game.status === 'PENDING' && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cerrar
            </Button>
            {isFirstInOrder ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isProcessing || showRejectForm}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rechazar
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Aprobar
                </Button>
              </>
            ) : (
              <div className="text-sm text-gray-500 py-2 px-3">
                No se puede procesar hasta que se aprueben los juegos anteriores
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
