'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Card } from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Save, Loader2, Trash2, Receipt } from 'lucide-react';
import { Expense } from '@/types/database';

const accountOptions = [
    { value: 'proveedores', label: 'Proveedores' },
    { value: 'alex_banorte', label: 'Alex Banorte' },
    { value: 'xpresa_banregio', label: 'Xpresa Banregio' },
    { value: 'xpresa_hsbc', label: 'Xpresa HSBC' },
    { value: 'mercado_pago_xpresa', label: 'Mercado Pago Xpresa' },
    { value: 'mercado_pago_alex', label: 'Mercado Pago Alex' },
    { value: 'efectivo', label: 'Efectivo' }
];

export default function GastosPage() {
    const router = useRouter();
    const supabase = getSupabaseClient();
    const { user } = useAuth();

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [account, setAccount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchExpenses();
        }
    }, [user, supabase]);

    const fetchExpenses = async () => {
        setIsFetching(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('expenses')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (fetchError) throw fetchError;
            setExpenses(data || []);
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('No hay sesión activa');
            return;
        }

        if (!description || amount <= 0 || !account) {
            setError('Por favor completa todos los campos');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('expenses')
                .insert({
                    description,
                    amount,
                    account,
                    vendedor_id: user.id
                } as any);

            if (insertError) throw insertError;

            // Reset form
            setDescription('');
            setAmount(0);
            setAccount('');

            // Refresh list
            fetchExpenses();
            alert('Gasto guardado correctamente');
        } catch (err) {
            console.error('Error saving expense:', err);
            setError(err instanceof Error ? err.message : 'Error al guardar el gasto');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

        try {
            const { error: deleteError } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            fetchExpenses();
        } catch (err) {
            console.error('Error deleting expense:', err);
            alert('Error al eliminar el gasto');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        GASTOS DE EMPRESA
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Registra los gastos operativos de la empresa
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Card */}
                <div className="md:col-span-1">
                    <Card className="p-6 sticky top-6">
                        <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
                            <Receipt size={20} className="text-accent" />
                            Nuevo Gasto
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs">
                                    {error}
                                </div>
                            )}

                            <Input
                                label="Descripción"
                                placeholder="Compra de insumos..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />

                            <Input
                                label="Cantidad ($)"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                required
                            />

                            <Select
                                label="Cuenta de Pago"
                                options={accountOptions}
                                value={account}
                                onChange={(e) => setAccount(e.target.value)}
                                placeholder="Seleccionar cuenta"
                                required
                            />

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    className="w-full"
                                    size="lg"
                                >
                                    <Save size={18} className="mr-2" />
                                    Guardar Gasto
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* List Container */}
                <div className="md:col-span-2">
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-text-primary mb-6">Gastos Recientes</h2>

                        {isFetching ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center py-10 text-text-secondary text-sm">
                                No hay gastos registrados recientemente.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-card-border">
                                            <th className="text-left py-3 px-2 text-xs uppercase text-text-muted font-bold">Fecha</th>
                                            <th className="text-left py-3 px-2 text-xs uppercase text-text-muted font-bold">Descripción</th>
                                            <th className="text-right py-3 px-2 text-xs uppercase text-text-muted font-bold">Monto</th>
                                            <th className="text-right py-3 px-2 text-xs uppercase text-text-muted font-bold">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-card-border">
                                        {expenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-background-tertiary/30 transition-colors group">
                                                <td className="py-3 px-2">
                                                    <div className="text-xs text-text-primary">{formatDate(exp.created_at)}</div>
                                                    <div className="text-[10px] text-text-muted uppercase">{exp.account.replace(/_/g, ' ')}</div>
                                                </td>
                                                <td className="py-3 px-2 text-sm text-text-primary">
                                                    {exp.description}
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-accent">
                                                    {formatCurrency(exp.amount)}
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <button
                                                        onClick={() => handleDelete(exp.id)}
                                                        className="p-2 text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
