'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBarrasEnTiempoReal } from '@/hooks/useBarrasEnTiempoReal';
import {
    ESTADOS_COLA,
    ETIQUETA_ESTADO,
    EMOJI_ESTADO,
    COLOR_FONDO_POR_ESTADO,
} from '@/lib/constantes';
import { cn } from '@/lib/utils';
import type { Barra, EstadoCola } from '@/lib/tipos';

interface GestionBarrasProps {
    barrasIniciales: Barra[];
}

/**
 * Panel de gestión de barras para el admin.
 * Permite cambiar el estado de cola de cada barra manualmente.
 */
export function GestionBarras({ barrasIniciales }: GestionBarrasProps) {
    const barras = useBarrasEnTiempoReal(barrasIniciales);
    const [cargandoId, setCargandoId] = useState<number | null>(null);

    const cambiarEstado = async (idBarra: number, nuevoEstado: EstadoCola) => {
        setCargandoId(idBarra);

        try {
            const respuesta = await fetch('/api/barras/estado', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idBarra, estadoCola: nuevoEstado }),
            });

            if (!respuesta.ok) {
                console.error('Error al actualizar estado');
            }
        } catch (error) {
            console.error('Error de conexión:', error);
        } finally {
            setCargandoId(null);
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {barras.map((barra) => (
                <Card key={barra.idBarra}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{barra.nombreLocalizacion}</CardTitle>
                            <Badge
                                className={cn(
                                    COLOR_FONDO_POR_ESTADO[barra.estadoCola],
                                    'text-white'
                                )}
                            >
                                {EMOJI_ESTADO[barra.estadoCola]} {ETIQUETA_ESTADO[barra.estadoCola]}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            {ESTADOS_COLA.map((estado) => (
                                <Button
                                    key={estado}
                                    size="sm"
                                    variant={barra.estadoCola === estado ? 'default' : 'outline'}
                                    disabled={cargandoId === barra.idBarra}
                                    onClick={() => cambiarEstado(barra.idBarra, estado)}
                                >
                                    {EMOJI_ESTADO[estado]} {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
