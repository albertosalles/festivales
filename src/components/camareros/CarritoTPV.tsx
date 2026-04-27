'use client';

import { LineaTransaccion } from "@/servicios/tpv.servicio";
import { formatearMoneda } from "@/lib/utils";

interface CarritoTPVProps {
    lineas: LineaTransaccion[];
    productosInfo: Record<number, { nombre: string, precio: number }>;
    onLimpiar: () => void;
    onCobrar: () => void;
    cargando: boolean;
}

export function CarritoTPV({ lineas, productosInfo, onLimpiar, onCobrar, cargando }: CarritoTPVProps) {
    const total = lineas.reduce((acc, l) => acc + (l.cantidad * l.precioUnitario), 0);
    const cantidadTotal = lineas.reduce((acc, l) => acc + l.cantidad, 0);

    return (
        <div className="fixed bottom-6 left-5 right-5 z-50">
            <div className="bg-surface-container/60 backdrop-blur-[20px] pb-4 px-5 pt-5 flex flex-col gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-outline-variant/30 rounded-[1.5rem]">
                
                {/* Expanded Cart Info Preview */}
                {lineas.length > 0 && (
                    <div className="max-h-32 overflow-y-auto mb-1 border-b border-outline-variant/10 hide-scrollbar pb-2">
                        <div className="space-y-1">
                            {lineas.map(l => (
                                <div key={l.idProducto} className="flex justify-between items-center text-sm font-headline">
                                    <span className="text-on-surface">
                                        <span className="text-secondary font-bold mr-2">{l.cantidad}x</span>
                                        {productosInfo[l.idProducto]?.nombre || 'Producto'}
                                    </span>
                                    <span className="text-on-surface-variant font-bold">
                                        {formatearMoneda(l.cantidad * l.precioUnitario)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mt-1">
                    <div className="flex flex-col">
                        <span className="text-xs font-body text-on-surface-variant uppercase tracking-widest">
                            Comanda actual ({cantidadTotal})
                        </span>
                        <span className="font-headline font-bold text-3xl text-on-surface tracking-tight">
                            {formatearMoneda(total)}
                        </span>
                    </div>
                    <button 
                        onClick={onLimpiar}
                        disabled={lineas.length === 0 || cargando}
                        className="w-12 h-12 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-error hover:border-error/50 transition-colors bg-surface-container-lowest/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>

                <button 
                    onClick={onCobrar}
                    disabled={lineas.length === 0 || cargando}
                    className="w-full bg-secondary hover:bg-[#00d7f0] active:scale-[0.98] transition-all rounded-full py-4 px-6 flex justify-between items-center group shadow-[0_0_20px_rgba(0,227,253,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="font-headline font-bold text-on-secondary uppercase tracking-wider text-lg">
                        {cargando ? 'PROCESANDO...' : 'COBRAR AL CLIENTE'}
                    </span>
                    <span className="material-symbols-outlined text-on-secondary text-2xl group-hover:translate-x-1 transition-transform">
                        arrow_forward
                    </span>
                </button>
            </div>
        </div>
    );
}
