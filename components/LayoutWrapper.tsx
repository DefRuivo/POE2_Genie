"use client";

import React, { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

function LayoutWrapperClient({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pathname, setPathname] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPathname(window.location.pathname);
        }
    }, []);

    const navigate = (path: string) => {
        if (typeof window !== 'undefined') {
            window.location.assign(path);
        }
    };

    // Hide Header/Sidebar on auth pages
    // Using simple includes check. Can be robustified if needed.
    const isAuthPage = ['/login', '/register', '/recover', '/reset-password'].includes(pathname || '');

    return (
        <>
            {!isAuthPage && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onNavigate={(path) => {
                        navigate(path);
                        setIsSidebarOpen(false);
                    }}
                />
            )}

            {/* Main Content Wrapper (Pushed by Sidebar on Desktop) */}
            <div className={`transition-all duration-300 ${!isAuthPage ? 'xl:pl-80' : ''}`}>
                {!isAuthPage && (
                    <Header
                        onMenuClick={() => setIsSidebarOpen(true)}
                        onHomeClick={() => navigate('/')}
                    />
                )}

                <div className="pt-4 min-h-[calc(100vh-200px)]">
                    {children}
                </div>

                {!isAuthPage && <Footer />}
            </div>
        </>
    );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    // Avoid stateful client hooks during static prerender.
    if (typeof window === 'undefined') {
        return <>{children}</>;
    }

    return <LayoutWrapperClient>{children}</LayoutWrapperClient>;
}
