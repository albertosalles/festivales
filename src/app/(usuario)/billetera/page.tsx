/**
 * Página de la billetera — Placeholder inicial.
 * Se completará con componentes TarjetaSaldo y FormularioRecarga.
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

            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <p className="text-4xl">💰</p>
                <p className="mt-4 text-lg font-medium">Próximamente</p>
                <p className="text-sm">
                    Aquí podrás ver tu saldo y recargar tu billetera.
                </p>
            </div>
        </div>
    );
}
