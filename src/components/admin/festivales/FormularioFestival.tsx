'use client';

import { useState } from 'react';

interface Props {
    onCancelar: () => void;
    onCreado: () => void | Promise<void>;
}

/**
 * Modal de creación de festival.
 * Las fechas son opcionales (se rellenan después si todavía no se conocen).
 */
export function FormularioFestival({ onCancelar, onCreado }: Props) {
    const [nombre, setNombre] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            setError('El nombre es obligatorio');
            return;
        }
        if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
            setError('La fecha de inicio no puede ser posterior a la de fin');
            return;
        }

        setEnviando(true);
        setError(null);
        try {
            const res = await fetch('/api/festivales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'crear',
                    nombre: nombre.trim(),
                    ubicacion: ubicacion.trim() || undefined,
                    fechaInicio: fechaInicio || undefined,
                    fechaFin: fechaFin || undefined,
                }),
            });
            if (!res.ok) {
                const { error: msg } = await res.json();
                throw new Error(msg || 'Error al crear festival');
            }
            await onCreado();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onCancelar}
        >
            <form
                onSubmit={enviar}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface-container rounded-2xl border border-white/10 p-8 w-full max-w-lg"
            >
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-neon-blue font-bold text-xs tracking-widest uppercase mb-2">
                            Nueva edición
                        </p>
                        <h3 className="font-headline text-3xl font-bold text-on-surface">
                            Crear festival
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onCancelar}
                        className="text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <Campo etiqueta="Nombre *" obligatorio>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="FestiApp Otoño 2026"
                            className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-lg border border-white/5 focus:border-neon-green/40 focus:outline-none transition-colors"
                            autoFocus
                            required
                        />
                    </Campo>

                    <Campo etiqueta="Ubicación">
                        <input
                            type="text"
                            value={ubicacion}
                            onChange={(e) => setUbicacion(e.target.value)}
                            placeholder="Madrid"
                            className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-lg border border-white/5 focus:border-neon-green/40 focus:outline-none transition-colors"
                        />
                    </Campo>

                    <div className="grid grid-cols-2 gap-3">
                        <Campo etiqueta="Inicio">
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-lg border border-white/5 focus:border-neon-green/40 focus:outline-none transition-colors"
                            />
                        </Campo>
                        <Campo etiqueta="Fin">
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="w-full bg-surface-container-high text-on-surface px-4 py-3 rounded-lg border border-white/5 focus:border-neon-green/40 focus:outline-none transition-colors"
                            />
                        </Campo>
                    </div>

                    <p className="text-[11px] text-on-surface-variant italic">
                        Las fechas son opcionales — puedes rellenarlas más tarde cuando se conozcan.
                        El festival se crea en estado <strong>en curso</strong> y no se activa automáticamente.
                    </p>
                </div>

                {error && (
                    <div className="bg-error/10 border border-error/30 rounded-lg p-3 mt-4">
                        <p className="text-error text-sm">{error}</p>
                    </div>
                )}

                <div className="flex gap-3 mt-6 pt-6 border-t border-white/5">
                    <button
                        type="button"
                        onClick={onCancelar}
                        className="flex-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors py-3"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={enviando}
                        className="flex-1 text-xs font-bold uppercase tracking-widest bg-neon-green text-black hover:brightness-110 transition-all py-3 rounded-lg disabled:opacity-50 shadow-[0_0_20px_rgba(186,253,0,0.3)]"
                    >
                        {enviando ? 'Creando…' : 'Crear festival'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Campo({
    etiqueta,
    children,
    obligatorio,
}: {
    etiqueta: string;
    children: React.ReactNode;
    obligatorio?: boolean;
}) {
    return (
        <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 block">
                {etiqueta} {obligatorio && <span className="text-neon-green">*</span>}
            </span>
            {children}
        </label>
    );
}
