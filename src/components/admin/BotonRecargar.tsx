'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function BotonRecargar() {
    const router = useRouter();
    const [girando, setGirando] = useState(false);

    const recargar = () => {
        setGirando(true);
        router.refresh();
        setTimeout(() => setGirando(false), 800);
    };

    return (
        <button
            onClick={recargar}
            title="Recargar datos"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
        >
            <span className={`material-symbols-outlined text-sm transition-transform duration-700 ${girando ? 'rotate-[360deg]' : ''}`}>
                refresh
            </span>
            Recargar
        </button>
    );
}
