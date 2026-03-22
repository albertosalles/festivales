import { CabeceraApp } from '@/components/layout/CabeceraApp';
import { NavbarUsuario } from '@/components/layout/NavbarUsuario';
import { ProveedorNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';
import { BannerInstalacionPWA } from '@/components/layout/BannerInstalacionPWA';

/**
 * Layout compartido para todas las rutas de usuario.
 * Incluye cabecera superior glassmórfica, navbar inferior neón, proveedor de notificaciones
 * y banner de instalación PWA para iOS Safari.
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
                <main className="contenido-pwa mx-auto w-full max-w-7xl flex-1 px-5 pb-32 pt-24">
                    {children}
                </main>
                <NavbarUsuario />
                <BannerInstalacionPWA />
            </div>
        </ProveedorNotificaciones>
    );
}
