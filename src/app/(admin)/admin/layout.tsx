import { LayoutAdminCliente } from '@/components/layout/LayoutAdminCliente';

/**
 * Layout para el panel de administración.
 * Sidebar lateral colapsable + header con blur.
 */
export default function LayoutAdmin({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#0e0e11]">
            <LayoutAdminCliente>{children}</LayoutAdminCliente>
        </div>
    );
}
