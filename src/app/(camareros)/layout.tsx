import { ReactNode } from 'react';
import { NOMBRE_FESTIVAL } from '@/lib/constantes';

export default function CamarerosLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-mesh min-h-screen overflow-hidden flex flex-col relative text-on-surface">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-neon-orange/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-neon-green/10 rounded-full blur-[120px]" />
            </div>

            {/* Route Content */}
            <main className="relative z-10 flex-1 overflow-auto bg-background">
                {children}
            </main>
        </div>
    );
}
