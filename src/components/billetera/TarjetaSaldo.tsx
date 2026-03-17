'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TarjetaSaldoProps {
    saldo: number;
    cargando: boolean;
}

/**
 * Tarjeta que muestra el saldo disponible en la billetera del usuario.
 */
export function TarjetaSaldo({ saldo, cargando }: TarjetaSaldoProps) {
    return (
        <Card className="border-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-white/90">
                    <span className="text-xl">💰</span>
                    Saldo disponible
                </CardTitle>
            </CardHeader>
            <CardContent>
                {cargando ? (
                    <div className="h-12 w-32 animate-pulse rounded-lg bg-white/20" />
                ) : (
                    <p className="text-4xl font-extrabold tracking-tight">
                        {saldo.toFixed(2)} €
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
