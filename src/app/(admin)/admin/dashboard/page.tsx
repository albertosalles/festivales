/**
 * Dashboard de administración — Placeholder inicial.
 */
export default function PaginaDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Resumen general del festival.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-6">
                    <p className="text-sm text-muted-foreground">Total Transacciones</p>
                    <p className="text-3xl font-bold">—</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <p className="text-sm text-muted-foreground">Saldo Medio</p>
                    <p className="text-3xl font-bold">—</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <p className="text-sm text-muted-foreground">Recaudación Total</p>
                    <p className="text-3xl font-bold">—</p>
                </div>
            </div>
        </div>
    );
}
