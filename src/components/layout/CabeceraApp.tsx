import { NOMBRE_FESTIVAL } from '@/lib/constantes';

/**
 * Cabecera común de la aplicación.
 * Se muestra en la parte superior de las vistas de usuario.
 */
export function CabeceraApp() {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-4xl items-center justify-center px-4">
                <h1 className="text-lg font-bold tracking-tight">
                    🎶 {NOMBRE_FESTIVAL}
                </h1>
            </div>
        </header>
    );
}
