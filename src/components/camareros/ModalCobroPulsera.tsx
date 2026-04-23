'use client';

import { useState } from 'react';
import { LectorQR } from './LectorQR';

type EstadoModal = 'escaneando' | 'confirmando' | 'procesando' | 'exito' | 'error';

interface ModalCobroPulseraProps {
    total: number;
    onConfirmar: (tokenPago: string) => Promise<void>;
    onCerrar: () => void;
}

export function ModalCobroPulsera({ total, onConfirmar, onCerrar }: ModalCobroPulseraProps) {
    const [estado, setEstado] = useState<EstadoModal>('escaneando');
    const [tokenEscaneado, setTokenEscaneado] = useState('');
    const [mensajeError, setMensajeError] = useState('');

    const manejarEscaneo = (texto: string) => {
        setTokenEscaneado(texto);
        setEstado('confirmando');
    };

    const confirmarCobro = async () => {
        setEstado('procesando');
        try {
            await onConfirmar(tokenEscaneado);
            setEstado('exito');
        } catch (e: any) {
            setMensajeError(e.message || 'Error en el cobro');
            setEstado('error');
        }
    };

    const reintentar = () => {
        setTokenEscaneado('');
        setMensajeError('');
        setEstado('escaneando');
    };

    return (
        // Backdrop
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={estado === 'escaneando' || estado === 'confirmando' || estado === 'error' ? onCerrar : undefined} />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-[#0e0e11] border border-white/10 rounded-t-3xl sm:rounded-2xl p-6 flex flex-col gap-5 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] z-10 animate-in slide-in-from-bottom duration-300">

                {/* Glows */}
                <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#e9ffba]/40 to-transparent" />

                {/* ---- ESTADO: ESCANEANDO ---- */}
                {estado === 'escaneando' && (
                    <>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-[#aeacb0] uppercase tracking-widest font-bold">Cobro Cashless</p>
                                <p className="font-headline font-black text-[#e9ffba] text-2xl tracking-tight mt-0.5">
                                    {total.toFixed(2)} €
                                </p>
                            </div>
                            <button onClick={onCerrar} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#aeacb0] hover:text-white border border-white/10 active:scale-95 transition-all">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#00e3fd]/10 flex items-center justify-center text-[#00e3fd]">
                                <span className="material-symbols-outlined text-2xl">contactless</span>
                            </div>
                            <p className="text-sm text-[#aeacb0] text-center">Escanea el <strong className="text-white">QR de la pulsera</strong> del cliente para identificarlo</p>
                        </div>

                        <div className="rounded-xl overflow-hidden bg-black/60 border border-white/5">
                            <LectorQR
                                alEscanear={manejarEscaneo}
                                alError={(err) => console.log('[Lector cobro silencioso]', err)}
                            />
                        </div>
                    </>
                )}

                {/* ---- ESTADO: CONFIRMANDO ---- */}
                {estado === 'confirmando' && (
                    <>
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-[#00e3fd]/10 flex items-center justify-center text-[#00e3fd] ring-2 ring-[#00e3fd]/30">
                                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>contactless</span>
                            </div>
                            <h2 className="font-headline font-black text-white text-xl">Pulsera Detectada</h2>
                            <p className="text-xs text-[#aeacb0] font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 break-all">
                                {tokenEscaneado}
                            </p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex justify-between items-center">
                            <span className="text-sm font-bold text-[#aeacb0] uppercase tracking-widest">Total a cobrar</span>
                            <span className="font-headline font-black text-[#e9ffba] text-2xl">{total.toFixed(2)} €</span>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={reintentar} className="flex-1 py-3.5 rounded-xl border border-white/15 text-[#aeacb0] font-bold text-sm hover:bg-white/5 active:scale-95 transition-all">
                                Rescaner
                            </button>
                            <button onClick={confirmarCobro} className="flex-[2] py-3.5 rounded-xl bg-[#e9ffba] text-[#496600] font-headline font-black text-lg flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(233,255,186,0.3)] active:scale-95 transition-all">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                                Cobrar
                            </button>
                        </div>
                    </>
                )}

                {/* ---- ESTADO: PROCESANDO ---- */}
                {estado === 'procesando' && (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <span className="material-symbols-outlined text-5xl text-[#e9ffba] animate-spin">progress_activity</span>
                        <p className="font-headline font-bold text-white text-lg">Procesando pago...</p>
                        <p className="text-sm text-[#aeacb0]">Descontando saldo de la pulsera</p>
                    </div>
                )}

                {/* ---- ESTADO: ÉXITO ---- */}
                {estado === 'exito' && (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <div className="w-20 h-20 rounded-full bg-[#e9ffba]/20 flex items-center justify-center ring-2 ring-[#e9ffba]/50">
                            <span className="material-symbols-outlined text-5xl text-[#e9ffba]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                        <div className="text-center">
                            <p className="font-headline font-black text-[#e9ffba] text-2xl">¡Cobro Realizado!</p>
                            <p className="text-sm text-[#aeacb0] mt-1">{total.toFixed(2)} € descontados correctamente</p>
                        </div>
                        <button onClick={onCerrar} className="w-full py-3.5 rounded-xl bg-[#e9ffba] text-[#496600] font-headline font-black text-lg active:scale-95 transition-all mt-2">
                            Siguiente Venta
                        </button>
                    </div>
                )}

                {/* ---- ESTADO: ERROR ---- */}
                {estado === 'error' && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center ring-2 ring-error/30">
                            <span className="material-symbols-outlined text-4xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                        </div>
                        <div className="text-center">
                            <p className="font-headline font-black text-error text-xl">Cobro Fallido</p>
                            <p className="text-sm text-[#aeacb0] mt-1">{mensajeError}</p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button onClick={onCerrar} className="flex-1 py-3.5 rounded-xl border border-white/15 text-[#aeacb0] font-bold text-sm hover:bg-white/5 active:scale-95 transition-all">
                                Cancelar
                            </button>
                            <button onClick={reintentar} className="flex-1 py-3.5 rounded-xl bg-error/20 text-error font-bold text-sm border border-error/30 hover:bg-error/30 active:scale-95 transition-all">
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
