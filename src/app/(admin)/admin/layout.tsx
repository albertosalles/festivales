import { SidebarAdmin } from '@/components/layout/SidebarAdmin';
import { CabeceraAdmin } from '@/components/layout/CabeceraAdmin';

/**
 * Layout para el panel de administración.
 * Sidebar lateral fijo + header con blur.
 */
export default function LayoutAdmin({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#0e0e11]">
            <SidebarAdmin />
            <CabeceraAdmin />
            <main className="ml-64 pt-24 px-10 pb-12 min-h-screen">
                {children}
            </main>
        </div>
    );
}
