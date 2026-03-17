'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Importes de recarga disponibles */
const IMPORTES_RECARGA = [15, 25, 50] as const;

interface SelectorRecargaProps {
    alRecargar: (monto: number) => Promise<void>;
    deshabilitado: boolean;
}

/**
 * Selector de recarga con botones de importe predefinido (15€, 25€, 50€).
 * Al seleccionar un importe, ejecuta la función de recarga.
 */
export function SelectorRecarga({ alRecargar, deshabilitado }: SelectorRecargaProps) {
    const [importeSeleccionado, setImporteSeleccionado] = useState<number | null>(null);
    const [cargando, setCargando] = useState(false);

    const manejarRecarga = async (monto: number) => {
        setImporteSeleccionado(monto);
        setCargando(true);

        try {
            await alRecargar(monto);
        } finally {
            setCargando(false);
            setImporteSeleccionado(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-xl">🔋</span>
                    Recargar billetera
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                    Selecciona el importe que deseas recargar:
                </p>
                <div className="grid grid-cols-3 gap-3">
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
                                    'h-20 text-xl font-bold transition-all',
                                    estaCargando && 'animate-pulse'
                                )}
                            >
                                {estaCargando ? '...' : `${importe} €`}
                            </Button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
