'use client';

import { Card, CardContent } from '@/components/ui/card';

interface TarjetaSaldoProps {
    saldo: number;
    cargando: boolean;
}

/**
 * Tarjeta que muestra el saldo disponible de forma prominente.
 * Diseño centrado con el saldo como elemento protagonista.
 */
export function TarjetaSaldo({ saldo, cargando }: TarjetaSaldoProps) {
    return (
        <Card className="border-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white shadow-xl">
            <CardContent className="flex flex-col items-center justify-center px-6 py-10">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-white/80">
                    <span className="text-lg">💰</span>
                    Saldo disponible
                </div>

                {cargando ? (
                    <div className="h-16 w-48 animate-pulse rounded-xl bg-white/20" />
                ) : (
                    <p className="text-7xl font-extrabold tracking-tight drop-shadow-lg">
                        {saldo.toFixed(2)}
                        <span className="ml-2 text-4xl font-bold text-white/80">€</span>
                    </p>
                )}

                <p className="mt-3 text-sm text-white/60">
                    Disponible para consumiciones
                </p>
            </CardContent>
        </Card>
    );
}
