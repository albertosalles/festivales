import { CabeceraApp } from '@/components/layout/CabeceraApp';
import { NavbarUsuario } from '@/components/layout/NavbarUsuario';
import { ProveedorNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';

/**
 * Layout compartido para todas las rutas de usuario.
 * Incluye cabecera superior glassmórfica, navbar inferior neón y proveedor de notificaciones.
 */
export default function LayoutUsuario({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProveedorNotificaciones>
            <div className="flex min-h-screen flex-col bg-mesh">
                <CabeceraApp />
                <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-32 pt-24">
                    {children}
                </main>
                <NavbarUsuario />
            </div>
        </ProveedorNotificaciones>
    );
}
