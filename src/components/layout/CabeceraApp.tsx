'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { NOMBRE_FESTIVAL } from '@/lib/constantes';
import { useSesion } from '@/hooks/useSesion';

/**
 * Cabecera glassmórfica de la aplicación estilo Stitch "Electric Nocturne".
 * Muestra logo, saldo real de la wallet, iconos y avatar.
 */
export function CabeceraApp() {
    const { sesion, cargando: cargandoSesion } = useSesion();
    const [saldo, setSaldo] = useState<number | null>(null);

    /** Consulta el saldo real de la wallet */
    const cargarSaldo = useCallback(async (idUsuario: number) => {
        try {
            const respuesta = await fetch(
                `/api/billetera/saldo?idUsuario=${idUsuario}`
            );
            const datos = await respuesta.json();

            if (respuesta.ok) {
                setSaldo(datos.saldo);
            }
        } catch {
            // Si falla, se queda en null y muestra "--"
        }
    }, []);

    useEffect(() => {
        if (!cargandoSesion && sesion) {
            cargarSaldo(sesion.idUsuario);
        }
    }, [cargandoSesion, sesion, cargarSaldo]);

    return (
        <header className="bg-[#0e0e11]/60 backdrop-blur-xl fixed top-0 w-full z-50 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <div className="flex justify-between items-center px-5 h-20 max-w-7xl mx-auto w-full">
                {/* Logo */}
                <div className="flex flex-col">
                    <Link href="/mapa" className="text-2xl font-black text-neon-green tracking-tighter font-headline uppercase">
                        {NOMBRE_FESTIVAL}
                    </Link>
                    <span className="text-[10px] font-label-text font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                        Live Experience
                    </span>
                </div>

                {/* Right side: balance + icons + avatar */}
                <div className="flex items-center gap-4">
                    {/* Balance display */}
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
                            Balance
                        </span>
                        <span className="text-neon-green font-headline font-black text-lg leading-none">
                            {saldo !== null ? `${saldo.toFixed(2)}€` : '--€'}
                        </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <Link
                            href="/billetera"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container active:scale-95 transition-transform text-on-surface-variant hover:text-neon-blue"
                        >
                            <span className="material-symbols-outlined">
                                account_balance_wallet
                            </span>
                        </Link>
                        <Link
                            href="/notificaciones"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container active:scale-95 transition-transform text-on-surface-variant hover:text-neon-blue"
                        >
                            <span className="material-symbols-outlined">
                                notifications
                            </span>
                        </Link>
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full border-2 border-neon-green/20 p-0.5 overflow-hidden bg-surface-container flex items-center justify-center">
                        {sesion ? (
                            <span className="text-neon-green font-headline font-bold text-sm">
                                {sesion.nombre.charAt(0).toUpperCase()}
                            </span>
                        ) : (
                            <span className="material-symbols-outlined text-on-surface-variant text-lg">
                                person
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
