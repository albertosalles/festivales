'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ModalPago } from '@/components/billetera/ModalPago';

/** Importes de recarga disponibles */
const IMPORTES_RECARGA = [15, 25, 50] as const;

interface SelectorRecargaProps {
    alRecargar: (monto: number) => Promise<void>;
    deshabilitado: boolean;
}

/**
 * Selector de recarga estilo Stitch "Electric Nocturne".
 * Botón principal neón con panel desplegable de importes predefinidos.
 * Al seleccionar un importe, abre el modal de método de pago.
 */
export function SelectorRecarga({ alRecargar, deshabilitado }: SelectorRecargaProps) {
    const [abierto, setAbierto] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [montoModal, setMontoModal] = useState<number | null>(null);

    /** Abre el modal de pago con el importe seleccionado */
    const abrirModalPago = (monto: number) => {
        setMontoModal(monto);
    };

    /** Callback cuando el pago es exitoso en el modal */
    const alConfirmarPago = async (monto: number) => {
        setCargando(true);
        try {
            await alRecargar(monto);
            setAbierto(false);
        } finally {
            setCargando(false);
        }
    };

    /** Cierra el modal de pago */
    const cerrarModal = () => {
        setMontoModal(null);
    };

    return (
        <>
            <div className="space-y-4">
                {/* Botón principal de recarga */}
                <button
                    disabled={deshabilitado || cargando}
                    onClick={() => setAbierto(!abierto)}
                    className={cn(
                        'w-full h-16 rounded-xl flex items-center justify-center gap-3 font-headline font-black text-lg uppercase tracking-tight transition-all active:scale-95',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        abierto
                            ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20'
                            : 'bg-neon-green text-[#496600] shadow-[0_10px_30px_rgba(233,255,186,0.2)]'
                    )}
                >
                    <span className="material-symbols-outlined text-xl">
                        {abierto ? 'close' : 'add_circle'}
                    </span>
                    {abierto ? 'Cancelar' : 'Recargar Saldo'}
                </button>

                {/* Panel de importes desplegable */}
                <div
                    className={cn(
                        'grid grid-cols-3 gap-4 overflow-hidden transition-all duration-300 ease-in-out',
                        abierto
                            ? 'max-h-40 opacity-100'
                            : 'max-h-0 opacity-0'
                    )}
                >
                    {IMPORTES_RECARGA.map((importe) => (
                        <button
                            key={importe}
                            disabled={deshabilitado || cargando}
                            onClick={() => abrirModalPago(importe)}
                            className={cn(
                                'h-24 rounded-[2rem] flex flex-col items-center justify-center transition-all duration-200 border',
                                'disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
                                'bg-surface-container border-outline-variant/10 hover:border-neon-green/30 hover:bg-surface-container-high'
                            )}
                        >
                            <span className="text-2xl font-headline font-black text-on-surface">
                                {importe}€
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">
                                Añadir
                            </span>
                        </button>
                    ))}
                </div>

                {/* Texto informativo bajo las opciones */}
                {abierto && (
                    <p className="text-center text-sm text-on-surface-variant">
                        Selecciona el importe que deseas recargar
                    </p>
                )}
            </div>

            {/* Modal de método de pago */}
            {montoModal !== null && (
                <ModalPago
                    monto={montoModal}
                    alConfirmar={alConfirmarPago}
                    alCerrar={cerrarModal}
                />
            )}
        </>
    );
}
