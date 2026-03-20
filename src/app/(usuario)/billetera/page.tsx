'use client';

/**
 * Página de la billetera del usuario — Diseño Stitch "Electric Nocturne".
 * Muestra el saldo disponible y permite recargar con importes predefinidos.
 */
import { ContenedorBilletera } from '@/components/billetera/ContenedorBilletera';

export default function PaginaBilletera() {
    return (
        <div className="max-w-2xl mx-auto">
            {/* Header Section */}
            <header className="mb-10">
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-neon-blue/10 text-neon-blue text-[10px] font-bold tracking-[0.2em] uppercase rounded">
                        Digital Wallet
                    </span>
                </div>
                <h1 className="text-5xl font-black font-headline tracking-tighter text-on-surface uppercase mb-2">
                    Billetera
                </h1>
                <p className="text-on-surface-variant font-medium">
                    Consulta tu saldo disponible y recarga desde aquí.
                </p>
            </header>

            <ContenedorBilletera />
        </div>
    );
}
