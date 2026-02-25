import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../types';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { profile, signOut } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        await signOut();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-background-light">
            {/* Top Navigation Header */}
            <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-4 md:px-10 lg:px-40 py-3">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between whitespace-nowrap">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 text-primary">
                        <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">confirmation_number</span>
                        </div>
                        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight">
                            Ticket
                        </h2>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="hidden md:flex flex-1 justify-center gap-8">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `text-sm font-semibold leading-normal border-b-2 pb-1 transition-colors ${isActive
                                    ? 'text-primary border-primary'
                                    : 'text-slate-600 border-transparent hover:text-primary'
                                }`
                            }
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/tickets/new"
                            end
                            className={({ isActive }) =>
                                `text-sm font-semibold leading-normal border-b-2 pb-1 transition-colors ${isActive
                                    ? 'text-primary border-primary'
                                    : 'text-slate-600 border-transparent hover:text-primary'
                                }`
                            }
                        >
                            Tambah Tiket
                        </NavLink>
                        <NavLink
                            to="/tickets"
                            end
                            className={({ isActive }) =>
                                `text-sm font-semibold leading-normal border-b-2 pb-1 transition-colors ${isActive
                                    ? 'text-primary border-primary'
                                    : 'text-slate-600 border-transparent hover:text-primary'
                                }`
                            }
                        >
                            Progress
                        </NavLink>
                        {profile?.role === 'admin' && (
                            <NavLink
                                to="/users"
                                end
                                className={({ isActive }) =>
                                    `text-sm font-semibold leading-normal border-b-2 pb-1 transition-colors ${isActive
                                        ? 'text-primary border-primary'
                                        : 'text-slate-600 border-transparent hover:text-primary'
                                    }`
                                }
                            >
                                Users
                            </NavLink>
                        )}
                    </nav>

                    {/* Right Section: Notification & Profile */}
                    <div className="flex items-center gap-4">
                        {/* User Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1 transition-all"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold text-slate-900 leading-tight">
                                        {profile?.full_name || 'Admin User'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 leading-tight">
                                        {profile?.role ? (ROLE_LABELS[profile.role] || profile.role) : 'User'}
                                    </p>
                                </div>
                                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/20 flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </div>
                                <span className="material-symbols-outlined text-slate-400 text-sm hidden sm:block">
                                    expand_more
                                </span>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-[60]">
                                    <div className="p-2">
                                        {/* Mobile: Show user info */}
                                        <div className="px-3 py-2 sm:hidden border-b border-slate-100 mb-1">
                                            <p className="text-sm font-bold text-slate-900">
                                                {profile?.full_name || 'Admin User'}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {profile?.role ? (ROLE_LABELS[profile.role] || profile.role) : 'User'}
                                            </p>
                                        </div>

                                        {/* Logout Option */}
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                handleSignOut();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors group"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">logout</span>
                                            <span className="font-semibold">Keluar</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="min-h-[calc(100vh-64px)] pb-20 md:pb-0">
                {children}
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 z-50 shadow-2xl">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 p-1.5 transition-all ${isActive ? 'text-primary' : 'text-slate-400'}`
                    }
                >
                    <span className="material-symbols-outlined text-[22px]">home</span>
                    <span className="text-[10px] font-medium">Home</span>
                </NavLink>
                <NavLink
                    to="/tickets/new"
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 p-1.5 transition-all ${isActive ? 'text-primary' : 'text-slate-400'}`
                    }
                >
                    <span className="material-symbols-outlined text-[22px]">add_circle</span>
                    <span className="text-[10px] font-medium">Tambah</span>
                </NavLink>
                <NavLink
                    to="/tickets"
                    end
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 p-1.5 transition-all ${isActive ? 'text-primary' : 'text-slate-400'}`
                    }
                >
                    <span className="material-symbols-outlined text-[22px]">list_alt</span>
                    <span className="text-[10px] font-medium">Progress</span>
                </NavLink>
                {profile?.role === 'admin' && (
                    <NavLink
                        to="/users"
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-0.5 p-1.5 transition-all ${isActive ? 'text-primary' : 'text-slate-400'}`
                        }
                    >
                        <span className="material-symbols-outlined text-[22px]">group</span>
                        <span className="text-[10px] font-medium">Users</span>
                    </NavLink>
                )}
            </nav>
        </div>
    );
};

export default Layout;
