import { CabeceraApp } from '@/components/layout/CabeceraApp';
import { NavbarUsuario } from '@/components/layout/NavbarUsuario';
import { ProveedorNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';

/**
 * Layout compartido para todas las rutas de usuario.
 * Incluye cabecera superior, navbar inferior y proveedor de notificaciones.
 */
export default function LayoutUsuario({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProveedorNotificaciones>
            <div className="flex min-h-screen flex-col">
                <CabeceraApp />
                <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-6">
                    {children}
                </main>
                <NavbarUsuario />
            </div>
        </ProveedorNotificaciones>
    );
}
