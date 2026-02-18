import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'

// =============================================
// Mock Supabase
// =============================================
const { mockGetSession, mockOnAuthStateChange, mockSignIn, mockSignOut, mockFrom } = vi.hoisted(() => ({
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
    mockSignIn: vi.fn(),
    mockSignOut: vi.fn(),
    mockFrom: vi.fn(),
}))

vi.mock('../../services/supabase', () => ({
    supabase: {
        auth: {
            getSession: mockGetSession,
            onAuthStateChange: mockOnAuthStateChange,
            signInWithPassword: mockSignIn,
            signOut: mockSignOut,
        },
        from: mockFrom,
    },
}))

import { AuthProvider, useAuth } from '../../contexts/AuthContext'

// =============================================
// Modul 6: AuthContext
// =============================================

// Helper component to consume auth context
function AuthConsumer() {
    const auth = useAuth()
    return (
        <div>
            <span data-testid="loading">{String(auth.loading)}</span>
            <span data-testid="user">{auth.user ? 'logged-in' : 'none'}</span>
            <span data-testid="isAdmin">{String(auth.isAdmin)}</span>
            <span data-testid="canManage">{String(auth.canManageTickets)}</span>
            <span data-testid="role">{auth.userRole || 'null'}</span>
            <span data-testid="profile">{auth.profile ? auth.profile.role : 'null'}</span>
        </div>
    )
}

// Helper to render with AuthProvider
function renderWithAuth() {
    return render(
        <AuthProvider>
            <AuthConsumer />
        </AuthProvider>
    )
}

beforeEach(() => {
    vi.clearAllMocks()

    // Default: no session, no subscription
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
    })
})

// Chainable helper for profile fetch
function chainable(resolvedValue: any) {
    const chain: any = {}
    chain.select = vi.fn(() => chain)
    chain.eq = vi.fn(() => chain)
    chain.single = vi.fn(() => chain)
    chain.then = (resolve: any) => resolve(resolvedValue)
    return chain
}

describe('useAuth outside AuthProvider', () => {
    it('6.1 - useAuth() di luar AuthProvider → throw error', () => {
        // Suppress console.error for expected error boundary
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })

        function BadComponent() {
            useAuth()
            return <div />
        }

        expect(() => render(<BadComponent />)).toThrow(
            'useAuth must be used within AuthProvider'
        )

        spy.mockRestore()
    })
})

describe('AuthProvider - initial state', () => {
    it('6.2 - loading awalnya true, lalu false setelah session check', async () => {
        renderWithAuth()

        // After session resolves (no session), loading should become false
        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false')
        })
    })

    it('6.4 - session tanpa user → user null, profile null', async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } })

        renderWithAuth()

        await waitFor(() => {
            expect(screen.getByTestId('user').textContent).toBe('none')
            expect(screen.getByTestId('profile').textContent).toBe('null')
        })
    })
})

describe('AuthProvider - with session', () => {
    it('6.3 - setelah session loaded → user logged-in, loading false', async () => {
        const mockUser = { id: 'user-1', email: 'test@test.com' }
        const mockProfile = { id: 'user-1', role: 'admin', full_name: 'Test' }

        mockGetSession.mockResolvedValue({
            data: { session: { user: mockUser } },
        })

        mockFrom.mockReturnValue(chainable({ data: mockProfile, error: null }))

        renderWithAuth()

        await waitFor(() => {
            expect(screen.getByTestId('user').textContent).toBe('logged-in')
            expect(screen.getByTestId('loading').textContent).toBe('false')
        })
    })

    it('6.8 - isAdmin bernilai true hanya ketika role === "admin"', async () => {
        const mockUser = { id: 'user-1', email: 'admin@test.com' }
        const mockProfile = { id: 'user-1', role: 'admin', full_name: 'Admin' }

        mockGetSession.mockResolvedValue({
            data: { session: { user: mockUser } },
        })
        mockFrom.mockReturnValue(chainable({ data: mockProfile, error: null }))

        renderWithAuth()

        await waitFor(() => {
            expect(screen.getByTestId('isAdmin').textContent).toBe('true')
        })
    })

    it('6.9 - isAdmin bernilai false untuk OUTLET', async () => {
        const mockUser = { id: 'user-2', email: 'outlet@test.com' }
        const mockProfile = { id: 'user-2', role: 'OUTLET', full_name: 'Outlet' }

        mockGetSession.mockResolvedValue({
            data: { session: { user: mockUser } },
        })
        mockFrom.mockReturnValue(chainable({ data: mockProfile, error: null }))

        renderWithAuth()

        await waitFor(() => {
            expect(screen.getByTestId('isAdmin').textContent).toBe('false')
        })
    })

    it('6.10 - canManageTickets true untuk ADMIN, ACCOUNTING_HO, FIN_ADMIN, IT_SABANG', async () => {
        const managerRoles = ['admin', 'ACCOUNTING_HO', 'FIN_ADMIN', 'IT_SABANG']

        for (const role of managerRoles) {
            vi.clearAllMocks()
            mockOnAuthStateChange.mockReturnValue({
                data: { subscription: { unsubscribe: vi.fn() } },
            })

            const mockUser = { id: `user-${role}`, email: `${role}@test.com` }
            const mockProfile = { id: `user-${role}`, role, full_name: role }

            mockGetSession.mockResolvedValue({
                data: { session: { user: mockUser } },
            })
            mockFrom.mockReturnValue(chainable({ data: mockProfile, error: null }))

            const { unmount } = renderWithAuth()

            await waitFor(() => {
                expect(screen.getByTestId('canManage').textContent).toBe('true')
            })

            unmount()
        }
    })

    it('6.11 - canManageTickets false untuk OUTLET', async () => {
        const mockUser = { id: 'user-3', email: 'outlet@test.com' }
        const mockProfile = { id: 'user-3', role: 'OUTLET', full_name: 'Outlet' }

        mockGetSession.mockResolvedValue({
            data: { session: { user: mockUser } },
        })
        mockFrom.mockReturnValue(chainable({ data: mockProfile, error: null }))

        renderWithAuth()

        await waitFor(() => {
            expect(screen.getByTestId('canManage').textContent).toBe('false')
        })
    })

    it('6.12 - userRole mengembalikan role dari profile', async () => {
        const mockUser = { id: 'u1', email: 'x@test.com' }
        const mockProfile = { id: 'u1', role: 'FIN_ADMIN', full_name: 'FA' }

        mockGetSession.mockResolvedValue({
            data: { session: { user: mockUser } },
        })
        mockFrom.mockReturnValue(chainable({ data: mockProfile, error: null }))

        renderWithAuth()

        await waitFor(() => {
            expect(screen.getByTestId('role').textContent).toBe('FIN_ADMIN')
        })
    })
})

describe('AuthProvider - signIn', () => {
    it('6.5 - signIn memanggil supabase.auth.signInWithPassword()', async () => {
        mockSignIn.mockResolvedValue({ error: null })

        let authRef: any
        function Capturer() {
            authRef = useAuth()
            return null
        }

        render(
            <AuthProvider>
                <Capturer />
            </AuthProvider>
        )

        await waitFor(() => expect(authRef).toBeDefined())

        await act(async () => {
            await authRef.signIn('user@test.com', 'pass123')
        })

        expect(mockSignIn).toHaveBeenCalledWith({
            email: 'user@test.com',
            password: 'pass123',
        })
    })

    it('6.6 - signIn gagal → return { error }', async () => {
        const mockError = new Error('Invalid credentials')
        mockSignIn.mockResolvedValue({ error: mockError })

        let authRef: any
        function Capturer() {
            authRef = useAuth()
            return null
        }

        render(
            <AuthProvider>
                <Capturer />
            </AuthProvider>
        )

        await waitFor(() => expect(authRef).toBeDefined())

        let result: any
        await act(async () => {
            result = await authRef.signIn('bad@test.com', 'wrong')
        })

        expect(result.error).toBeTruthy()
    })
})

describe('AuthProvider - signOut', () => {
    it('6.7 - signOut → clear user dan profile', async () => {
        const mockUser = { id: 'u1', email: 'x@test.com' }
        const mockProfile = { id: 'u1', role: 'admin', full_name: 'X' }

        mockGetSession.mockResolvedValue({
            data: { session: { user: mockUser } },
        })
        mockFrom.mockReturnValue(chainable({ data: mockProfile, error: null }))
        mockSignOut.mockResolvedValue({})

        let authRef: any
        function Capturer() {
            authRef = useAuth()
            return <span data-testid="u">{authRef.user ? 'yes' : 'no'}</span>
        }

        render(
            <AuthProvider>
                <Capturer />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('u').textContent).toBe('yes')
        })

        await act(async () => {
            await authRef.signOut()
        })

        expect(screen.getByTestId('u').textContent).toBe('no')
    })
})
