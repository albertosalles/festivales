import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    COLOR_FONDO_POR_ESTADO,
    COLOR_TEXTO_POR_ESTADO,
    ETIQUETA_ESTADO,
    EMOJI_ESTADO,
} from '@/lib/constantes';
import type { Barra } from '@/lib/tipos';

interface TarjetaBarraProps {
    barra: Barra;
}

/**
 * Tarjeta visual de una barra del recinto.
 * El color de fondo cambia según el estado de la cola.
 */
export function TarjetaBarra({ barra }: TarjetaBarraProps) {
    return (
        <Card
            className={cn(
                'transition-all duration-500 ease-in-out hover:scale-105',
                COLOR_FONDO_POR_ESTADO[barra.estadoCola]
            )}
        >
            <CardHeader className="pb-2">
                <CardTitle
                    className={cn(
                        'text-lg font-bold',
                        COLOR_TEXTO_POR_ESTADO[barra.estadoCola]
                    )}
                >
                    {barra.nombreLocalizacion}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Badge
                    variant="secondary"
                    className="text-sm"
                >
                    {EMOJI_ESTADO[barra.estadoCola]} {ETIQUETA_ESTADO[barra.estadoCola]}
                </Badge>
            </CardContent>
        </Card>
    );
}
