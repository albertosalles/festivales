'use client';

import { formatearMoneda } from '@/lib/utils';

export interface EntradaHistorial {
    idTransaccion: number;
    tipoMovimiento: 'compra' | 'recarga';
    monto: number;
    fecha: string;
    nombreBarra: string | null;
}

interface Props {
    transacciones: EntradaHistorial[];
    cargando: boolean;
}

function formatearFecha(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function HistorialTransacciones({ transacciones, cargando }: Props) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline font-black text-lg uppercase tracking-tighter text-on-surface">
                    Historial
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Últimas {transacciones.length} operaciones
                </span>
            </div>

            {cargando ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-container" />
                    ))}
                </div>
            ) : transacciones.length === 0 ? (
                <div className="bg-surface-container rounded-2xl p-10 text-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-4xl">receipt_long</span>
                    <p className="mt-3 text-sm font-headline font-bold uppercase text-on-surface-variant">
                        Sin transacciones todavía
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {transacciones.map((tx) => {
                        const esCompra = tx.tipoMovimiento === 'compra';
                        return (
                            <div
                                key={tx.idTransaccion}
                                className="flex items-center gap-4 bg-surface-container rounded-2xl px-5 py-4"
                            >
                                {/* Icono */}
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        esCompra ? 'bg-error/10' : 'bg-neon-green/10'
                                    }`}
                                >
                                    <span
                                        className={`material-symbols-outlined text-xl ${
                                            esCompra ? 'text-error' : 'text-neon-green'
                                        }`}
                                    >
                                        {esCompra ? 'shopping_bag' : 'add_card'}
                                    </span>
                                </div>

                                {/* Descripción */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-headline font-bold text-sm uppercase text-on-surface truncate">
                                        {esCompra
                                            ? tx.nombreBarra ?? 'Compra en barra'
                                            : 'Recarga de saldo'}
                                    </p>
                                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                                        {formatearFecha(tx.fecha)}
                                    </p>
                                </div>

                                {/* Monto */}
                                <span
                                    className={`font-headline font-black text-base shrink-0 ${
                                        esCompra ? 'text-error' : 'text-neon-green'
                                    }`}
                                >
                                    {esCompra ? '−' : '+'}{formatearMoneda(tx.monto)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
