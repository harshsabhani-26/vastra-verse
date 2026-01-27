'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthModalContextType {
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    authView: 'login' | 'signup' | 'forgot-password';
    setAuthView: (view: 'login' | 'signup' | 'forgot-password') => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot-password'>('login');

    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    return (
        <AuthModalContext.Provider value={{
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal,
            authView,
            setAuthView
        }}>
            {children}
        </AuthModalContext.Provider>
    );
}

export function useAuthModal() {
    const context = useContext(AuthModalContext);
    if (context === undefined) {
        throw new Error('useAuthModal must be used within a AuthModalProvider');
    }
    return context;
}
