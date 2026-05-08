'use client';

import { useEffect, useState } from 'react';
import { SidebarAdmin } from '@/components/layout/SidebarAdmin';
import { CabeceraAdmin } from '@/components/layout/CabeceraAdmin';

const CLAVE_STORAGE = 'festiapp_sidebar_colapsado';

/**
 * Wrapper cliente del layout admin. Mantiene el estado colapsado/expandido
 * del sidebar y propaga el ajuste de márgenes a la cabecera y al main.
 */
export function LayoutAdminCliente({ children }: { children: React.ReactNode }) {
    const [colapsado, setColapsado] = useState(false);
    const [hidratado, setHidratado] = useState(false);

    useEffect(() => {
        const guardado = localStorage.getItem(CLAVE_STORAGE);
        if (guardado === 'true') setColapsado(true);
        setHidratado(true);
    }, []);

    const toggle = () => {
        setColapsado((prev) => {
            const nuevo = !prev;
            localStorage.setItem(CLAVE_STORAGE, String(nuevo));
            return nuevo;
        });
    };

    return (
        <>
            <SidebarAdmin colapsado={colapsado} onToggle={toggle} />
            <CabeceraAdmin colapsado={colapsado} />
            <main
                className={`pt-24 px-10 pb-12 min-h-screen transition-[margin] duration-300 ease-out ${
                    colapsado ? 'ml-20' : 'ml-64'
                } ${hidratado ? '' : 'opacity-100'}`}
            >
                {children}
            </main>
        </>
    );
}
