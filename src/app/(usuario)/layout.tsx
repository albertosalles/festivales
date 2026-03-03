import { CabeceraApp } from '@/components/layout/CabeceraApp';
import { NavbarUsuario } from '@/components/layout/NavbarUsuario';

/**
 * Layout compartido para todas las rutas de usuario.
 * Incluye cabecera superior y navbar inferior.
 */
export default function LayoutUsuario({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <CabeceraApp />
            <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-6">
                {children}
            </main>
            <NavbarUsuario />
        </div>
    );
}
