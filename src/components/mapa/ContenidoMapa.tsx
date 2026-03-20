'use client';

import { useState } from 'react';
import { GridBarras } from '@/components/mapa/GridBarras';
import { MapaRecinto } from '@/components/mapa/MapaRecinto';
import { cn } from '@/lib/utils';
import type { Barra } from '@/lib/tipos';

type VistaActiva = 'lista' | 'mapa';

interface ContenidoMapaProps {
    barrasIniciales: Barra[];
}

/**
 * Componente contenedor que alterna entre la vista de lista (GridBarras)
 * y la vista de mapa (MapaRecinto) con un toggle de pills.
 * Incluye hero section con imagen y leyenda de colores.
 */
export function ContenidoMapa({ barrasIniciales }: ContenidoMapaProps) {
    const [vista, setVista] = useState<VistaActiva>('lista');

    return (
        <div className="space-y-10">
            {/* Hero Section */}
            <section>
                <div className="relative w-full h-[300px] md:h-[409px] rounded-[2rem] overflow-hidden shadow-2xl group">
                    {/* Festival aerial image */}
                    <img alt="Festival Map View" className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 transition-all duration-700" data-alt="Aerial view of a large music festival with glowing stages" data-location="Music Festival Grounds" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnZyBDx7P_lf_SP3E2tOkjehTXJM0IPTHmsx0Zc7j2LAgdsl8TS-9X_t9KuImq9p6UDnS0rZAnBynf7P_lb0FBe_AH5-JHRAXt_3oJ0riy8Kjck8cE37h1hI7JzIMp7Y4LoNi2r4jBuyLrHJEAIwNI-uAn6VrXp_o84bRCcVGS9EC33QKD4QvLLYLfS8Luys640qq8QB17tmJ5WjLTimlpe1fo1bIS44rg9gLoYuHYthZmrGrdlz0tlZFI3ppT7fTSUC9QtSAnEMY" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                    {/* Map UI Elements */}
                    <div className="absolute inset-0 flex flex-col justify-between p-6">
                        <div className="flex justify-between items-start">
                            <div className="bg-surface-container/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                                <span className="text-xs font-bold uppercase tracking-widest text-neon-blue flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                                    Live Map
                                </span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h1 className="font-headline text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-on-surface">
                                Bienvenido a{' '}
                                <br />
                                <span className="text-neon-green">FestiApp</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </section>

            {/* Toggle Lista/Mapa */}
            <div className="flex justify-center">
                <div className="inline-flex p-1.5 bg-surface-container/40 backdrop-blur-md rounded-full border border-white/5 shadow-2xl">
                    <button
                        onClick={() => setVista('lista')}
                        className={cn(
                            'flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300',
                            vista === 'lista'
                                ? 'bg-neon-green text-[#496600] shadow-[0_0_20px_rgba(233,255,186,0.3)]'
                                : 'text-on-surface-variant hover:text-neon-blue'
                        )}
                    >
                        <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                        <span className="text-xs font-black uppercase tracking-widest font-headline">Lista</span>
                    </button>
                    <button
                        onClick={() => setVista('mapa')}
                        className={cn(
                            'flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300',
                            vista === 'mapa'
                                ? 'bg-neon-green text-[#496600] shadow-[0_0_20px_rgba(233,255,186,0.3)]'
                                : 'text-on-surface-variant hover:text-neon-blue'
                        )}
                    >
                        <span className="material-symbols-outlined text-sm">map</span>
                        <span className="text-xs font-black uppercase tracking-widest font-headline">Mapa</span>
                    </button>
                </div>
            </div>

            {/* List View Content */}
            {vista === 'lista' && (
                <section>
                    {/* Header + Legend */}
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-on-surface">
                                ¿Algo para picar?
                            </h2>
                            <p className="text-on-surface-variant text-sm font-medium">
                                Estado de colas en todas las barras en tiempo real
                            </p>
                        </div>
                        <div className="hidden md:flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-neon-green shadow-[0_0_8px_rgba(233,255,186,0.6)]" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                                    Baja
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-neon-orange shadow-[0_0_8px_rgba(255,116,57,0.6)]" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                                    Media
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_rgba(255,110,132,0.6)]" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                                    Alta
                                </span>
                            </div>
                        </div>
                    </div>

                    <GridBarras barrasIniciales={barrasIniciales} />
                </section>
            )}

            {/* Map View Content */}
            {vista === 'mapa' && (
                <section>
                    <MapaRecinto barrasIniciales={barrasIniciales} />
                </section>
            )}
        </div>
    );
}
