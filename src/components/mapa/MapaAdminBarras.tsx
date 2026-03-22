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

interface MapaAdminBarrasProps {
    barrasIniciales: Barra[];
}

/**
 * Mapa interactivo de barras para el administrador.
 * Similar al mapa del usuario pero con controles para cambiar
 * manualmente el estado de cola de cada barra.
 */
export function MapaAdminBarras({ barrasIniciales }: MapaAdminBarrasProps) {
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

    if (barras.length === 0) {
        return (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <p className="text-4xl">🍺</p>
                <p className="mt-4 text-lg font-medium">No hay barras registradas</p>
                <p className="text-sm">
                    Las barras aparecerán aquí cuando se configuren en la base de datos.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {barras.map((barra) => (
                <Card
                    key={barra.idBarra}
                    className={cn(
                        'transition-all duration-500 ease-in-out',
                        COLOR_FONDO_POR_ESTADO[barra.estadoCola]
                    )}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle
                                className='text-lg font-bold text-gray-900'
                            >
                                {barra.nombreLocalizacion}
                            </CardTitle>
                            <Badge variant="secondary" className="text-sm">
                                {EMOJI_ESTADO[barra.estadoCola]} {ETIQUETA_ESTADO[barra.estadoCola]}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p
                            className='mb-3 text-xs font-medium text-gray-800'
                        >
                            Cambiar estado:
                        </p>
                        <div className="flex gap-2">
                            {ESTADOS_COLA.map((estado) => (
                                <Button
                                    key={estado}
                                    size="sm"
                                    variant={barra.estadoCola === estado ? 'default' : 'secondary'}
                                    disabled={cargandoId === barra.idBarra}
                                    onClick={() => cambiarEstado(barra.idBarra, estado)}
                                    className="flex-1"
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
