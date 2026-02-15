'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    Clock,
    FileText,
    Truck,
    List,
    Plus,
    LogOut,
    User,
    Menu,
    X,
    Receipt
} from 'lucide-react';
import { Profile } from '@/types/database';

interface SidebarProps {
    user: Profile | null;
}

const navItems = [
    { href: '/dashboard', label: 'Pedidos', icon: LayoutDashboard },
    { href: '/dashboard?status=pendiente', label: 'Pendientes', icon: Clock },
    { href: '/dashboard?status=cotizado', label: 'Cotizados', icon: FileText },
    { href: '/dashboard?status=enviado', label: 'Enviados', icon: Truck },
    { href: '/gastos', label: 'Gastos', icon: Receipt },
    { href: '/dashboard?status=all', label: 'Todos', icon: List },
];

export function Sidebar({ user: initialUser }: SidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentStatus = searchParams.get('status') || 'all';
    const [user, setUser] = useState<Profile | null>(initialUser);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!initialUser) {
            const savedSession = localStorage.getItem('xpresa_session');
            if (savedSession) {
                try {
                    const { user: savedUser } = JSON.parse(savedSession);
                    setUser({
                        id: savedUser.id,
                        full_name: savedUser.user_metadata.full_name,
                        avatar_url: '',
                        updated_at: new Date().toISOString()
                    } as Profile);
                } catch (e) {
                    console.error('Error parsing session');
                }
            }
        }
    }, [initialUser]);

    // Close sidebar when clicking a link on mobile
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('xpresa_session');
        document.cookie = "xpresa_auth_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = '/login';
    };

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background-secondary border-b border-card-border px-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="font-bold text-text-primary">XpresaControl</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-text-primary hover:bg-background-tertiary rounded-lg transition-colors"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed left-0 top-0 h-screen w-64 bg-background-secondary border-r border-card-border flex flex-col z-50
                transition-transform duration-300 lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* User Profile */}
                <div className="p-6 border-b border-card-border mt-16 lg:mt-0">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-background-tertiary flex items-center justify-center border border-accent/20">
                            {user?.avatar_url ? (
                                <Image
                                    src={user.avatar_url}
                                    alt={user.full_name || 'Avatar'}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <User className="text-accent" size={24} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-text-primary font-medium truncate">
                                {user?.full_name || 'Vendedor'}
                            </p>
                            <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold">En Línea</p>
                        </div>
                    </div>
                </div>

                {/* New Order Button */}
                <div className="p-4">
                    <Link
                        href="/nuevo-pedido"
                        className="w-full flex items-center justify-center gap-2 bg-accent text-background font-bold py-3 px-4 rounded-xl hover:bg-accent-hover transition-all duration-200 shadow-glow uppercase text-sm"
                    >
                        <Plus size={18} />
                        Nuevo Pedido
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        // Precise active logic
                        let active = false;
                        if (item.href.startsWith('/dashboard')) {
                            const url = new URL(item.href, 'http://localhost');
                            const itemStatus = url.searchParams.get('status') || 'all';
                            active = pathname === '/dashboard' && currentStatus === itemStatus;
                        } else {
                            active = pathname === item.href;
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
                                    ? 'bg-accent/10 text-accent font-medium'
                                    : 'text-text-muted hover:bg-background-tertiary hover:text-text-primary'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-card-border">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
