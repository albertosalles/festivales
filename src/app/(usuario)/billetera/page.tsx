import { ContenedorBilletera } from '@/components/billetera/ContenedorBilletera';

export const metadata = {
    title: 'Mi Billetera | FestiApp',
    description: 'Consulta tu saldo disponible y recarga tu billetera del festival.',
};

/**
 * Página de la billetera del usuario.
 * Muestra el saldo disponible y permite recargar con importes predefinidos.
 */
export default function PaginaBilletera() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Mi Billetera</h2>
                <p className="text-muted-foreground">
                    Consulta tu saldo disponible y recarga desde aquí.
                </p>
            </div>

            <ContenedorBilletera />
        </div>
    );
}
