import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
    const { profile, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="w-[280px] h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 p-8">
            <div className="mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-xl font-black">
                        D
                    </div>
                    <div className="text-xl font-black">Datafix</div>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                        `flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`
                    }
                >
                    <span className="text-xl">📊</span>
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/tickets/new"
                    className={({ isActive }) =>
                        `flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`
                    }
                >
                    <span className="text-xl">➕</span>
                    <span>Create Ticket</span>
                </NavLink>

                <NavLink
                    to="/tickets"
                    className={({ isActive }) =>
                        `flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`
                    }
                >
                    <span className="text-xl">📋</span>
                    <span>Ticket List</span>
                </NavLink>
            </nav>

            <div className="pt-6 border-t border-slate-800">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center font-bold">
                        {getInitials(profile?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{profile?.full_name || 'User'}</div>
                        <div className="text-xs text-slate-400 capitalize">{profile?.role || 'user'}</div>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all"
                >
                    <span>🚪</span>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
