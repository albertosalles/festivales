'use client';

/**
 * Página de notificaciones — Placeholder inicial.
 * Se completará con el componente ListaNotificaciones.
 */
export default function PaginaNotificaciones() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Notificaciones</h2>
                <p className="text-muted-foreground">
                    Recibe avisos cuando las barras tengan poca cola.
                </p>
            </div>

            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <p className="text-4xl">🔔</p>
                <p className="mt-4 text-lg font-medium">Sin notificaciones</p>
                <p className="text-sm">
                    Te avisaremos cuando una barra tenga poca cola.
                </p>
            </div>
        </div>
    );
}
