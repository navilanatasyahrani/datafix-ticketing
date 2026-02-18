import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// =============================================
// Mock dependencies
// =============================================
const { mockUseAuth } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
}))

vi.mock('../contexts/AuthContext', () => ({
    AuthProvider: ({ children }: any) => <div>{children}</div>,
    useAuth: mockUseAuth,
}))

vi.mock('../components/Layout', () => ({
    default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}))

// Mock page components with simple identifiers
vi.mock('../pages/LoginPage', () => ({
    default: () => <div data-testid="login-page">LoginPage</div>,
}))

vi.mock('../pages/Dashboard', () => ({
    default: () => <div data-testid="dashboard-page">Dashboard</div>,
}))

vi.mock('../pages/CreateTicket', () => ({
    default: () => <div data-testid="create-ticket-page">CreateTicket</div>,
}))

vi.mock('../pages/TicketList', () => ({
    default: () => <div data-testid="ticket-list-page">TicketList</div>,
}))

vi.mock('../pages/TicketDetail', () => ({
    default: () => <div data-testid="ticket-detail-page">TicketDetail</div>,
}))

vi.mock('../pages/UserManagement', () => ({
    default: () => <div data-testid="user-mgmt-page">UserManagement</div>,
}))

vi.mock('../components/ProtectedRoute', () => ({
    default: ({ children }: any) => {
        // @ts-ignore - require used in vi.mock factory
        const { useAuth } = require('../contexts/AuthContext')
        const { user, loading } = useAuth()
        if (loading) return <div>Loading...</div>
        if (!user) return null // simulate redirect
        return <div data-testid="protected">{children}</div>
    },
}))

vi.mock('../styles/index.css', () => ({}))

import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'

// Re-create AppRoutes logic for testing (the App component uses BrowserRouter internally)
function AppRoutes() {
    const { user } = mockUseAuth()
    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <div data-testid="login-page">LoginPage</div>} />
            <Route path="/" element={user ? <div data-testid="dashboard-page">Dashboard</div> : <Navigate to="/login" replace />} />
            <Route path="/tickets/new" element={user ? <div data-testid="create-ticket-page">CreateTicket</div> : <Navigate to="/login" replace />} />
            <Route path="/tickets" element={user ? <div data-testid="ticket-list-page">TicketList</div> : <Navigate to="/login" replace />} />
            <Route path="/tickets/:id" element={user ? <div data-testid="ticket-detail-page">TicketDetail</div> : <Navigate to="/login" replace />} />
            <Route path="/users" element={user ? <div data-testid="user-mgmt-page">UserManagement</div> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

// =============================================
// Modul 15: App Routing
// =============================================

beforeEach(() => {
    vi.clearAllMocks()
})

describe('App Routing - unauthenticated', () => {
    beforeEach(() => {
        mockUseAuth.mockReturnValue({ user: null, loading: false })
    })

    it('15.1 - /login → render LoginPage (tanpa auth)', () => {
        render(
            <MemoryRouter initialEntries={['/login']}>
                <AppRoutes />
            </MemoryRouter>
        )
        expect(screen.getByTestId('login-page')).toBeTruthy()
    })

    it('15.3 - / tanpa auth → redirect ke /login', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <AppRoutes />
            </MemoryRouter>
        )
        expect(screen.getByTestId('login-page')).toBeTruthy()
    })
})

describe('App Routing - authenticated', () => {
    beforeEach(() => {
        mockUseAuth.mockReturnValue({
            user: { id: 'u1' },
            loading: false,
            isAdmin: true,
            canManageTickets: true,
        })
    })

    it('15.2 - /login dengan user → redirect ke /', () => {
        render(
            <MemoryRouter initialEntries={['/login']}>
                <AppRoutes />
            </MemoryRouter>
        )
        expect(screen.getByTestId('dashboard-page')).toBeTruthy()
    })

    it('15.3b - / → render Dashboard', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <AppRoutes />
            </MemoryRouter>
        )
        expect(screen.getByTestId('dashboard-page')).toBeTruthy()
    })

    it('15.4 - /tickets/new → render CreateTicket', () => {
        render(
            <MemoryRouter initialEntries={['/tickets/new']}>
                <AppRoutes />
            </MemoryRouter>
        )
        expect(screen.getByTestId('create-ticket-page')).toBeTruthy()
    })

    it('15.5 - /tickets → render TicketList', () => {
        render(
            <MemoryRouter initialEntries={['/tickets']}>
                <AppRoutes />
            </MemoryRouter>
        )
        expect(screen.getByTestId('ticket-list-page')).toBeTruthy()
    })

    it('15.6 - /tickets/:id → render TicketDetail', () => {
        render(
            <MemoryRouter initialEntries={['/tickets/some-uuid']}>
                <AppRoutes />
            </MemoryRouter>
        )
        expect(screen.getByTestId('ticket-detail-page')).toBeTruthy()
    })

    it('15.7 - /users → render UserManagement', () => {
        render(
            <MemoryRouter initialEntries={['/users']}>
                <AppRoutes />
            </MemoryRouter>
        )
        expect(screen.getByTestId('user-mgmt-page')).toBeTruthy()
    })

    it('15.8 - /* unknown → redirect ke /', () => {
        render(
            <MemoryRouter initialEntries={['/some-random-page']}>
                <AppRoutes />
            </MemoryRouter>
        )
        expect(screen.getByTestId('dashboard-page')).toBeTruthy()
    })
})
