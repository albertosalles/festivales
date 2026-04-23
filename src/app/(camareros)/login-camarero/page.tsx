'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { LectorQR } from '@/components/camareros/LectorQR';
import { tpvServicio } from '@/servicios/tpv.servicio';

export default function CamareroLogin() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
        }>
            <CamareroLoginContent />
        </Suspense>
    );
}

function CamareroLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Si llegamos con parametro ?barra=123, nos saltamos la cámara
    const barraInicial = searchParams.get('barra') || '';

    const [idBarra, setIdBarra] = useState(barraInicial);
    const [nombreBarra, setNombreBarra] = useState('');
    const [idCamarero, setIdCamarero] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (idBarra) {
            tpvServicio.obtenerDatosBarra(Number(idBarra))
                .then(data => setNombreBarra(data.nombre_localizacion || `Barra #${idBarra}`))
                .catch(e => {
                    console.error("Error obteniendo nombre barra", e);
                    setNombreBarra(`Barra #${idBarra}`);
                });
        }
    }, [idBarra]);

    const manejarEscaneo = (textoEscaneado: string) => {
        try {
            const urlUrl = new URL(textoEscaneado);
            const params = new URLSearchParams(urlUrl.search);
            const barra = params.get('barra');
            if (barra) {
                setIdBarra(barra);
            } else {
                setError('El QR escaneado no contiene información de barra.');
            }
        } catch {
            // Si es texto simple (e.g. "1")
            setIdBarra(textoEscaneado);
        }
    };

    const iniciarAsignacion = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!idBarra.trim() || !idCamarero.trim()) {
            setError('Introduce el ID de Camarero');
            return;
        }

        setCargando(true);
        try {
            const idBarraNum = Number(idBarra);
            const idCamareroNum = Number(idCamarero);

            // Inicia el turno en Supabase: cierra cualquier turno previo abierto
            // y crea una nueva asignación con fecha_inicio = ahora
            const asignacion = await tpvServicio.iniciarTurno(idCamareroNum, idBarraNum);

            // Guardar en localStorage para el TPV y el cierre de turno posterior
            localStorage.setItem('tpv_barra', idBarra);
            localStorage.setItem('tpv_nombre_barra', nombreBarra);
            localStorage.setItem('tpv_camarero', idCamarero);
            localStorage.setItem('tpv_asignacion', String(asignacion.id_asignacion));

            router.push(RUTAS.CAMARERO_TPV);
        } catch (e: any) {
            setError(e.message || 'Error al vincular con la barra.');
            setCargando(false);
        }
    };

    // ESTADO 1: Cámara Abierta (Aún no hay idBarra)
    if (!idBarra) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden bg-background">
                {/* Ambient Glow Effects */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#e9ffba] opacity-5 blur-[120px] pointer-events-none"></div>
                
                <div className="w-full max-w-md bg-[rgba(25,25,29,0.6)] backdrop-blur-[20px] rounded-xl p-6 flex flex-col gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-outline-variant/10 relative z-10">
                    <header className="text-center">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">qr_code_scanner</span>
                        <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">Escanea la Barra</h1>
                        <p className="text-sm text-on-surface-variant mt-1">Apunta la cámara al código QR de la barra en la que vas a trabajar.</p>
                    </header>
                    
                    {error && (
                        <div className="bg-error/10 border border-error/50 text-error text-center text-sm font-medium p-3 rounded-xl">
                            {error}
                        </div>
                    )}
                    
                    <div className="rounded-xl overflow-hidden shadow-inner bg-black/50">
                        <LectorQR alEscanear={manejarEscaneo} alError={(err) => console.log('Lector silencioso:', err)} />
                    </div>

                    <div className="pt-2 text-center">
                        <button 
                            onClick={() => router.push(RUTAS.INICIO)}
                            className="text-sm font-bold tracking-widest uppercase text-on-surface-variant hover:text-on-surface"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ESTADO 2: Barra detectada, pedir ID (Plantilla Stitch)
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden bg-[#0e0e11] text-[#f9f5fa]">
            
            <div className="absolute top-6 right-6 z-20">
                <button 
                    onClick={() => setIdBarra('')} // Volver al escaneo
                    className="w-12 h-12 rounded-full bg-surface-container-lowest/10 flex items-center justify-center text-[#f9f5fa] hover:bg-surface-container-lowest/20 transition-colors border border-outline-variant/15"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Ambient Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#e9ffba] opacity-10 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00e3fd] opacity-10 blur-[120px] pointer-events-none"></div>

            {/* Main Content Container (glass-panel) */}
            <main className="w-full max-w-md bg-[rgba(25,25,29,0.6)] backdrop-blur-[20px] rounded-xl p-8 border border-white/10 relative z-10 flex flex-col gap-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                
                {/* Header & Success Message */}
                <header className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#e9ffba]/20 flex items-center justify-center text-[#e9ffba] mb-2 ring-2 ring-[#e9ffba]/40">
                        <span className="material-symbols-outlined text-4xl" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div>
                        <h1 className="font-headline text-3xl font-bold text-[#e9ffba] tracking-tight leading-none mb-2">
                            QR Escaneado Correctamente
                        </h1>
                    </div>
                </header>

                {error && (
                    <div className="bg-error/10 border border-error/50 text-error text-sm font-medium p-3 rounded-xl text-center">
                        {error}
                    </div>
                )}

                {/* Location Info Card */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#00e3fd]/10 flex items-center justify-center text-[#00e3fd]">
                        <span className="material-symbols-outlined text-2xl">local_bar</span>
                    </div>
                    <div>
                        <p className="text-sm text-[#aeacb0] uppercase tracking-wider font-semibold mb-1">Barra Detectada</p>
                        <p className="font-headline font-bold text-xl tracking-tight">{nombreBarra || "Buscando..."}</p>
                    </div>
                </div>

                {/* Input Section */}
                <form onSubmit={iniciarAsignacion} className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[#aeacb0] uppercase tracking-widest" htmlFor="staff-id">
                            ID de Camarero
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aeacb0] material-symbols-outlined">badge</span>
                            <input 
                                id="staff-id"
                                type="number"
                                value={idCamarero}
                                onChange={(e) => setIdCamarero(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-2xl font-headline font-bold text-center placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#e9ffba] focus:border-transparent transition-all appearance-none"
                                placeholder="0000"
                                required
                                disabled={cargando || !nombreBarra}
                                style={{ MozAppearance: 'textfield' }}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={cargando || !nombreBarra}
                        className="w-full bg-[#e9ffba] text-[#496600] rounded-xl py-4 font-headline font-bold text-lg flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(233,255,186,0.3)] transition-all active:scale-95 mt-4 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>
                            link
                        </span>
                        {cargando ? 'Vinculando...' : 'Vincular a Barra'}
                    </button>
                </form>
            </main>
        </div>
    );
}
