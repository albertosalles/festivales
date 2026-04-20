'use client';

import { useState } from 'react';

interface ControlConciertoProps {
    generosDisponibles: string[];
    generoActual: string | null;
}

/**
 * Componente de Control de Concierto para el panel de administración.
 * Permite seleccionar y actualizar el género musical que suena en el festival.
 * Diseño Stitch "Electric Nocturne" con neon accents.
 */
export function ControlConcierto({
    generosDisponibles,
    generoActual,
}: ControlConciertoProps) {
    const [generoSeleccionado, setGeneroSeleccionado] = useState(
        generoActual ?? ''
    );
    const [generoActivo, setGeneroActivo] = useState(generoActual);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const manejarActualizar = async () => {
        if (!generoSeleccionado) {
            setError('Selecciona un género musical');
            return;
        }

        if (generoSeleccionado === generoActivo) {
            setError('Ese género ya está sonando');
            return;
        }

        setError('');
        setMensaje('');
        setCargando(true);

        try {
            const respuesta = await fetch('/api/conciertos/estado', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ genero: generoSeleccionado }),
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(datos.error || 'Error al actualizar');
                return;
            }

            setGeneroActivo(generoSeleccionado);
            setMensaje(`¡Concierto actualizado a ${generoSeleccionado}!`);

            // Limpiar mensaje después de 4s
            setTimeout(() => setMensaje(''), 4000);
        } catch {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="bg-surface-container rounded-xl p-8 relative overflow-hidden border border-white/5">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h4 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-neon-blue">
                            music_note
                        </span>
                        Control de Concierto
                    </h4>
                    <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter mt-1">
                        Selecciona el género que suena ahora
                    </p>
                </div>

                {/* Live indicator */}
                {generoActivo && (
                    <div className="flex items-center gap-2 bg-neon-green/10 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_#e9ffba]" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-neon-green">
                            En Vivo
                        </span>
                    </div>
                )}
            </div>

            {/* Current genre display */}
            {generoActivo && (
                <div className="mb-6 p-4 bg-surface-container-high rounded-xl border border-neon-green/20 shadow-[0_0_20px_rgba(233,255,186,0.08)]">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                        Sonando ahora
                    </p>
                    <p className="font-headline text-2xl font-black text-neon-green tracking-tighter">
                        🎵 {generoActivo}
                    </p>
                </div>
            )}

            {/* Selector + Button */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <select
                        value={generoSeleccionado}
                        onChange={(e) => {
                            setGeneroSeleccionado(e.target.value);
                            setError('');
                            setMensaje('');
                        }}
                        className="w-full bg-surface-container-high text-on-surface border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/30 transition-all"
                    >
                        <option value="" disabled>
                            Seleccionar género…
                        </option>
                        {generosDisponibles.map((genero) => (
                            <option key={genero} value={genero}>
                                {genero}
                                {genero === generoActivo ? ' (actual)' : ''}
                            </option>
                        ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">
                        expand_more
                    </span>
                </div>

                <button
                    onClick={manejarActualizar}
                    disabled={cargando || !generoSeleccionado}
                    className="px-6 py-3.5 rounded-xl bg-neon-blue text-[#002b4e] font-black font-headline text-sm tracking-tight uppercase shadow-[0_0_20px_rgba(166,218,255,0.3)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                    {cargando ? (
                        <span className="material-symbols-outlined animate-spin text-sm">
                            progress_activity
                        </span>
                    ) : (
                        <span className="material-symbols-outlined text-sm">
                            campaign
                        </span>
                    )}
                    {cargando ? 'Actualizando…' : 'Cambiar Concierto'}
                </button>
            </div>

            {/* Status messages */}
            {error && (
                <p className="mt-4 text-sm text-error font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                </p>
            )}
            {mensaje && (
                <p className="mt-4 text-sm text-neon-green font-medium flex items-center gap-2 animate-pulse">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {mensaje}
                </p>
            )}

            {/* Info note */}
            <p className="mt-6 text-[10px] text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[12px]">info</span>
                Los usuarios con este género favorito recibirán una notificación
            </p>

            {/* Decorative glow */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-neon-blue/5 rounded-full blur-[60px] pointer-events-none" />
        </div>
    );
}
