'use client';

interface TarjetaSaldoProps {
    saldo: number;
    cargando: boolean;
}

/**
 * Tarjeta de saldo estilo Stitch "Electric Nocturne".
 * Gradiente oscuro neón con el saldo como protagonista.
 */
export function TarjetaSaldo({ saldo, cargando }: TarjetaSaldoProps) {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-surface-container-lowest via-surface-container to-surface-container-high border border-outline-variant/10 shadow-2xl">
            {/* Background decorative elements */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-neon-green/5 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-neon-blue/5 rounded-full blur-[80px]" />

            <div className="relative flex flex-col items-center justify-center px-6 py-14">
                <div className="mb-4 flex items-center gap-3 text-on-surface-variant">
                    <span
                        className="material-symbols-outlined text-neon-green text-2xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        account_balance_wallet
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
                        Saldo disponible
                    </span>
                </div>

                {cargando ? (
                    <div className="h-20 w-56 animate-pulse rounded-xl bg-surface-container-high" />
                ) : (
                    <p className="text-7xl sm:text-8xl font-black font-headline tracking-tighter text-neon-green drop-shadow-[0_0_30px_rgba(233,255,186,0.3)]">
                        {saldo.toFixed(2)}
                        <span className="ml-2 text-4xl font-bold text-neon-green/50">€</span>
                    </p>
                )}

                <p className="mt-4 text-sm text-on-surface-variant font-medium">
                    Disponible para consumiciones en el festival
                </p>
            </div>
        </div>
    );
}
