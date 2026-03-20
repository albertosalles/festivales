import { SidebarAdmin } from '@/components/layout/SidebarAdmin';

/**
 * Layout para el panel de administración.
 * Incluye sidebar lateral fijo.
 */
export default function LayoutAdmin({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <SidebarAdmin />
            <main className="ml-64 min-h-screen p-8">
                {children}
            </main>
        </div>
    );
}
