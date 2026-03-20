import { SidebarAdmin } from '@/components/layout/SidebarAdmin';

/**
 * Layout para el panel de administración.
 * Sidebar lateral fijo + fondo oscuro con mesh gradient.
 */
export default function LayoutAdmin({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-mesh">
            <SidebarAdmin />
            <main className="ml-64 min-h-screen p-8">
                {children}
            </main>
        </div>
    );
}
