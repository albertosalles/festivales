'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RUTAS } from '@/lib/constantes';

interface Props {
    error: Error & { digest?: string };
    reset: () => void;
}

const ES_ERROR_SIN_FESTIVAL = (msg: string) =>
    msg.includes('festival activo') || msg.includes('No hay ningún festival');

/**
 * Error boundary para el panel de administración.
 *
 * Captura dos casos frecuentes:
 *  1. Sin festival activo → invita a activar uno desde /admin/festivales.
 *  2. Cualquier otro error → muestra el mensaje y un botón para reintentar.
 */
export default function ErrorAdmin({ error, reset }: Props) {
    useEffect(() => {
        // Solo loguear errores inesperados
        if (!ES_ERROR_SIN_FESTIVAL(error.message)) {
            console.error('[admin error boundary]', error);
        }
    }, [error]);

    const sinFestival = ES_ERROR_SIN_FESTIVAL(error.message);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            {sinFestival ? (
                <>
                    {/* Icono */}
                    <div className="w-20 h-20 rounded-full bg-neon-orange/10 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-neon-orange">
                            festival
                        </span>
                    </div>

                    <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface mb-3">
                        Sin festival activo
                    </h1>
                    <p className="text-on-surface-variant text-sm max-w-sm mb-8">
                        Las métricas y datos operativos necesitan un festival en curso.
                        Activa o crea uno desde el panel de festivales.
                    </p>

                    <div className="flex gap-3">
                        <Link
                            href={RUTAS.ADMIN_FESTIVALES}
                            className="flex items-center gap-2 bg-neon-green text-black font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-lg hover:brightness-110 transition-all shadow-[0_0_20px_rgba(186,253,0,0.3)]"
                        >
                            <span className="material-symbols-outlined text-base">add_circle</span>
                            Ir a Festivales
                        </Link>
                        <button
                            onClick={reset}
                            className="text-xs font-bold uppercase tracking-widest bg-white/5 text-on-surface-variant hover:bg-white/10 transition-colors px-6 py-3 rounded-lg"
                        >
                            Reintentar
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Error genérico */}
                    <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-error">
                            error
                        </span>
                    </div>

                    <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface mb-3">
                        Algo ha ido mal
                    </h1>
                    <p className="text-on-surface-variant text-sm max-w-sm mb-2">
                        {error.message || 'Error inesperado en el panel de administración.'}
                    </p>
                    {error.digest && (
                        <p className="text-[10px] text-on-surface-variant/50 font-mono mb-8">
                            digest: {error.digest}
                        </p>
                    )}

                    <button
                        onClick={reset}
                        className="flex items-center gap-2 bg-neon-blue/10 text-neon-blue font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-lg hover:bg-neon-blue/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">refresh</span>
                        Reintentar
                    </button>
                </>
            )}
        </div>
    );
}
