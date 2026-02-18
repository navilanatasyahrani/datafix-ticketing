import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// =============================================
// Mock AuthContext
// =============================================
const { mockUseAuth } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
}))

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: mockUseAuth,
}))

import ProtectedRoute from '../../components/ProtectedRoute'

// =============================================
// Modul 7: ProtectedRoute
// =============================================

describe('ProtectedRoute', () => {
    it('7.1 - loading state → render spinner', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: true,
        })

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div data-testid="child">Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        )

        // Spinner should be present (animate-spin class element)
        const spinner = document.querySelector('.animate-spin')
        expect(spinner).toBeTruthy()

        // Children should NOT be rendered
        expect(screen.queryByTestId('child')).toBeNull()
    })

    it('7.2 - no user (not authenticated) → Navigate ke /login', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
        })

        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <ProtectedRoute>
                    <div data-testid="child">Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        )

        // Children should NOT be rendered
        expect(screen.queryByTestId('child')).toBeNull()
    })

    it('7.3 - user ada (authenticated) → render children', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'user-1', email: 'test@test.com' },
            loading: false,
        })

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div data-testid="child">Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        )

        expect(screen.getByTestId('child')).toBeTruthy()
        expect(screen.getByText('Protected Content')).toBeTruthy()
    })
})
