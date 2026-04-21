'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { tpvServicio } from '@/servicios/tpv.servicio';

export default function HistorialCamarero() {
    const router = useRouter();
    const [idBarra, setIdBarra] = useState<number>(0);
    const [nombreBarra, setNombreBarra] = useState<string>('');
    const [cargando, setCargando] = useState(true);
    const [transacciones, setTransacciones] = useState<any[]>([]);

    useEffect(() => {
        const _idBarra = Number(localStorage.getItem('tpv_barra'));
        const _nombreBarra = localStorage.getItem('tpv_nombre_barra') || `Barra #${_idBarra}`;
        
        if (!_idBarra) {
            router.push(RUTAS.CAMARERO_LOGIN);
            return;
        }
        setIdBarra(_idBarra);
        setNombreBarra(_nombreBarra);

        tpvServicio.obtenerHistorial(_idBarra)
            .then(data => setTransacciones(data || []))
            .catch(console.error)
            .finally(() => setCargando(false));
    }, [router]);

    const cerrarSesion = () => {
         localStorage.removeItem('tpv_barra');
         localStorage.removeItem('tpv_nombre_barra');
         localStorage.removeItem('tpv_camarero');
         router.push(RUTAS.CAMARERO_LOGIN);
    };

    return (
        <div className="font-body antialiased bg-background text-on-surface pb-6 md:pb-0 min-h-screen flex flex-col">
            {/* TopAppBar */}
            <header className="bg-[#0e0e11]/80 backdrop-blur-lg flex items-center justify-between px-5 py-4 w-full sticky top-0 z-50 border-b border-outline-variant/10 shadow-[0_10px_30px_rgba(233,255,186,0.05)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-body text-on-surface-variant tracking-widest uppercase">Staff Member</span>
                        <h1 className="font-headline font-black text-[#e9ffba] tracking-tighter text-lg leading-none">{nombreBarra}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => router.push(RUTAS.CAMARERO_INCIDENCIAS)}
                        className="bg-error/10 hover:bg-error/20 active:scale-95 duration-200 transition-colors border border-error/30 rounded-xl px-4 py-2 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-error text-sm filled">report</span>
                        <span className="text-error font-body text-xs font-bold tracking-wider uppercase">Incident</span>
                    </button>
                    <button 
                        onClick={cerrarSesion}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-variant hover:bg-surface-bright border border-outline-variant/30 text-on-surface-variant hover:text-on-surface active:scale-95 transition-all duration-200"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </header>

            {/* Secondary Navigation Tabs */}
            <div className="bg-surface-container-low border-b border-outline-variant/30 sticky top-[72px] z-40">
                <div className="flex px-5 pt-3 gap-6">
                    <button 
                        onClick={() => router.push(RUTAS.CAMARERO_TPV)}
                        className="pb-3 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface transition-colors font-body text-sm font-bold tracking-wider uppercase"
                    >
                        Venta
                    </button>
                    <button className="pb-3 border-b-2 border-primary text-primary font-body text-sm font-bold tracking-wider uppercase">
                        Historial
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="pt-6 px-5 max-w-lg mx-auto w-full flex-1">
                {cargando ? (
                    <div className="text-center p-10 font-body text-on-surface-variant animate-pulse">Cargando tickets...</div>
                ) : (
                    <div className="space-y-4 pb-10">
                        {transacciones.length === 0 ? (
                            <div className="text-center p-10 bg-surface-container rounded-xl border border-outline-variant/10">
                                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">receipt</span>
                                <p className="text-on-surface-variant font-body font-bold text-sm uppercase tracking-widest">Sin transacciones</p>
                            </div>
                        ) : (
                            transacciones.map(tx => {
                                // Resumen de productos ej: "2x Cerveza, 1x Agua"
                                const resumenLineas = tx.lineas_transaccion
                                    ?.map((l: any) => `${l.cantidad}x ${l.productos?.nombre || 'Prod.'}`)
                                    .join(', ') || 'Productos varios';
                                
                                return (
                                    <div key={tx.id_transaccion} className="bg-surface-container rounded-xl p-4 flex justify-between items-center group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        
                                        <div className="flex gap-4 items-center z-10 w-3/4">
                                            <div className="text-on-surface-variant font-body font-medium text-sm flex-shrink-0">
                                                {new Date(tx.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-body font-bold text-on-surface truncate">
                                                    {resumenLineas}
                                                </div>
                                                <div className="font-label text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                                                    <span className="material-symbols-outlined text-[14px]">contactless</span>
                                                    Pulsera Cashless
                                                </div>
                                            </div>
                                        </div>

                                        <div className="font-headline font-black text-xl text-primary z-10 flex-shrink-0 text-right">
                                            €{Number(tx.monto).toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
