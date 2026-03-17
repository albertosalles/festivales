'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

/** Importes de recarga disponibles */
const IMPORTES_RECARGA = [15, 25, 50] as const;

interface SelectorRecargaProps {
    alRecargar: (monto: number) => Promise<void>;
    deshabilitado: boolean;
}

/**
 * Botón de recarga con panel desplegable de importes predefinidos.
 * Al pulsar "Recargar saldo" se muestran las opciones de importe.
 */
export function SelectorRecarga({ alRecargar, deshabilitado }: SelectorRecargaProps) {
    const [abierto, setAbierto] = useState(false);
    const [importeSeleccionado, setImporteSeleccionado] = useState<number | null>(null);
    const [cargando, setCargando] = useState(false);

    const manejarRecarga = async (monto: number) => {
        setImporteSeleccionado(monto);
        setCargando(true);

        try {
            await alRecargar(monto);
            setAbierto(false);
        } finally {
            setCargando(false);
            setImporteSeleccionado(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Botón principal de recarga */}
            <Button
                size="lg"
                disabled={deshabilitado}
                onClick={() => setAbierto(!abierto)}
                className={cn(
                    'w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-300',
                    'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500',
                    'text-white border-0'
                )}
            >
                {abierto ? (
                    <>
                        <X className="size-5" />
                        Cancelar
                    </>
                ) : (
                    <>
                        <Plus className="size-5" />
                        Recargar saldo
                    </>
                )}
            </Button>

            {/* Panel de importes desplegable */}
            <div
                className={cn(
                    'grid grid-cols-3 gap-3 overflow-hidden transition-all duration-300 ease-in-out',
                    abierto
                        ? 'max-h-40 opacity-100'
                        : 'max-h-0 opacity-0'
                )}
            >
                {IMPORTES_RECARGA.map((importe) => {
                    const estaCargando = cargando && importeSeleccionado === importe;
                    return (
                        <Button
                            key={importe}
                            size="lg"
                            variant="outline"
                            disabled={deshabilitado || cargando}
                            onClick={() => manejarRecarga(importe)}
                            className={cn(
                                'h-20 rounded-xl text-xl font-bold transition-all duration-200',
                                'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700',
                                'dark:hover:bg-purple-950 dark:hover:border-purple-700 dark:hover:text-purple-300',
                                estaCargando && 'animate-pulse border-purple-400 bg-purple-50 dark:bg-purple-950'
                            )}
                        >
                            {estaCargando ? (
                                <span className="text-purple-500">...</span>
                            ) : (
                                `${importe} €`
                            )}
                        </Button>
                    );
                })}
            </div>

            {/* Texto informativo bajo las opciones */}
            {abierto && (
                <p className="text-center text-sm text-muted-foreground">
                    Selecciona el importe que deseas recargar
                </p>
            )}
        </div>
    );
}
