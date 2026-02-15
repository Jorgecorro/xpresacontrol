'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrderCard, OrderFilter } from '@/components/orders';
import { useOrders } from '@/hooks';
import { OrderStatus } from '@/types/database';
import { Loader2, Package, Plus, FileText } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const statusParam = searchParams.get('status');

    const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>(
        (statusParam as OrderStatus | 'all') || 'all'
    );

    // Sync state with URL parameter (important for sidebar links)
    React.useEffect(() => {
        setActiveStatus((statusParam as OrderStatus | 'all') || 'all');
    }, [statusParam]);

    const { orders, isLoading, error, counts } = useOrders({ status: activeStatus });

    const handleStatusChange = (status: OrderStatus | 'all') => {
        const params = new URLSearchParams(searchParams.toString());
        if (status === 'all') {
            params.delete('status');
        } else {
            params.set('status', status);
        }
        router.push(`/dashboard?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">
                        Mis Pedidos
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Gestiona y da seguimiento a tus pedidos textiles
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => router.push('/gastos')}
                        className="flex items-center justify-center gap-2 bg-background-tertiary text-text-primary font-bold py-3 px-6 rounded-xl hover:bg-background-tertiary/80 transition-all duration-200 border border-card-border uppercase text-sm w-full sm:w-auto"
                    >
                        <FileText size={20} />
                        Gastos
                    </button>
                    <button
                        onClick={() => router.push('/nuevo-pedido')}
                        className="flex items-center justify-center gap-2 bg-accent text-background font-bold py-3 px-6 rounded-xl hover:bg-accent-hover transition-all duration-200 shadow-glow uppercase text-sm w-full sm:w-auto"
                    >
                        <Plus size={20} />
                        Nuevo Pedido
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
                <OrderFilter
                    activeStatus={activeStatus}
                    onStatusChange={handleStatusChange}
                    counts={counts}
                />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
                    {error}
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-4 rounded-full bg-background-tertiary mb-4">
                        <Package className="w-12 h-12 text-text-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                        No hay pedidos
                    </h3>
                    <p className="text-text-secondary max-w-md">
                        {activeStatus === 'all'
                            ? 'Aún no tienes pedidos. Crea tu primer pedido haciendo clic en "Nuevo Pedido".'
                            : `No hay pedidos con estado "${activeStatus}".`
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
