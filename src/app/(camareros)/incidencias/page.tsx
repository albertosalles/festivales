'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { tpvServicio } from '@/servicios/tpv.servicio';

const CATEGORIAS_INCIDENCIA = [
    { id: 'stock', icono: 'inventory_2', nombre: 'Falta de Stock' },
    { id: 'limpieza', icono: 'cleaning_services', nombre: 'Limpieza' },
    { id: 'seguridad', icono: 'security', nombre: 'Seguridad / Altercado' },
    { id: 'soporte', icono: 'support_agent', nombre: 'Soporte Técnico' },
    { id: 'otros', icono: 'help', nombre: 'Otros' }
];

export default function IncidenciasCamarero() {
    const router = useRouter();
    const [cargando, setCargando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState('');
    
    const [idBarra, setIdBarra] = useState(0);
    const [idCamarero, setIdCamarero] = useState(0);
    
    const [categoria, setCategoria] = useState('');
    const [descripcion, setDescripcion] = useState('');

    useEffect(() => {
        const barra = Number(localStorage.getItem('tpv_barra'));
        const cam = Number(localStorage.getItem('tpv_camarero'));
        if (!barra || !cam) {
             router.push(RUTAS.CAMARERO_LOGIN);
        } else {
             setIdBarra(barra);
             setIdCamarero(cam);
        }
    }, [router]);

    const enviarIncidencia = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!categoria) {
            setError('Selecciona una categoría para la alerta');
            return;
        }

        setCargando(true);
        try {
            await tpvServicio.reportarIncidencia({
                idBarra,
                idCamarero,
                tipoIncidencia: categoria,
                descripcion
            });
            setEnviado(true);
            setTimeout(() => {
                router.push(RUTAS.CAMARERO_TPV);
            }, 3000);
        } catch(err: any) {
            setError(err.message || 'Error al enviar la incidencia');
        } finally {
            setCargando(false);
        }
    };

    if (enviado) {
        return (
            <div className="flex flex-col items-center justify-center p-6 h-full min-h-[80vh] text-center">
                <span className="material-symbols-outlined text-neon-green text-6xl mb-4">check_circle</span>
                <h2 className="font-headline font-black text-2xl uppercase text-on-surface mb-2">Aviso Enviado</h2>
                <p className="text-on-surface-variant text-sm max-w-xs">Tu aviso ha sido notificado correctamente al centro de control. Redirigiendo al TPV...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative p-4">
             <header className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => router.push(RUTAS.CAMARERO_TPV)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container border border-outline-variant/20 text-on-surface hover:text-error transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex flex-col">
                    <h1 className="font-headline font-black uppercase text-xl text-error drop-shadow-[0_0_8px_rgba(255,110,132,0.3)]">Reportar Incidencia</h1>
                    <span className="font-label-text text-[10px] tracking-widest text-on-surface-variant uppercase">Notifica un problema rápido a la central</span>
                </div>
            </header>

            {error && (
                <div className="bg-error/10 border border-error text-error text-sm p-3 mb-6 rounded-xl">
                    {error}
                </div>
            )}

            <form onSubmit={enviarIncidencia} className="flex flex-col gap-6 flex-1">
                <div className="space-y-3">
                    <label className="font-label-text font-bold text-xs uppercase tracking-widest text-on-surface-variant">Selecciona el tipo de Alerta</label>
                    <div className="grid grid-cols-2 gap-3">
                        {CATEGORIAS_INCIDENCIA.map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setCategoria(c.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 ${
                                    categoria === c.id 
                                        ? 'bg-error/10 border-error text-error shadow-[0_0_15px_rgba(255,110,132,0.2)]'
                                        : 'bg-surface-container border-outline-variant/10 text-on-surface-variant hover:border-error/30'
                                }`}
                            >
                                <span className="material-symbols-outlined text-3xl mb-2">{c.icono}</span>
                                <span className="font-headline text-xs font-bold text-center leading-tight uppercase relative w-full h-[28px] overflow-visible break-words whitespace-normal break-all">
                                    {c.nombre}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 flex-1">
                    <label className="font-label-text font-bold text-xs uppercase tracking-widest text-on-surface-variant">Detalles adicionales (Opcional)</label>
                    <textarea 
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Ej. Faltan vasos grandes y hielo en la zona derecha..."
                        className="w-full h-32 bg-surface-container border border-outline-variant/10 rounded-2xl p-4 text-on-surface font-headline placeholder:text-outline/40 focus:ring-2 focus:ring-error/50 outline-none resize-none transition-all"
                    />
                </div>

                <div className="mt-auto pt-6">
                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full h-16 bg-error flex items-center justify-center rounded-2xl transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 shadow-[0_5px_20px_rgba(255,110,132,0.4)]"
                    >
                        <span className="font-headline font-black text-white text-xl uppercase tracking-widest mr-2">
                            {cargando ? 'Enviando...' : 'Notificar Ahora'}
                        </span>
                        <span className="material-symbols-outlined text-white">campaign</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
