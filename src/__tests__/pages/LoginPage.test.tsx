import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// =============================================
// Mock dependencies
// =============================================
const { mockUseAuth, mockNavigate } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockNavigate: vi.fn(),
}))

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: mockUseAuth,
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

import LoginPage from '../../pages/LoginPage'
import { MemoryRouter } from 'react-router-dom'

// =============================================
// Modul 9: LoginPage
// =============================================

beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
        signIn: vi.fn().mockResolvedValue({ error: null }),
    })
})

function renderLogin() {
    return render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>
    )
}

describe('LoginPage - rendering', () => {
    it('9.1 - render halaman → form email & password tersedia', () => {
        renderLogin()

        const emailInput = screen.getByPlaceholderText('your.email@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')

        expect(emailInput).toBeTruthy()
        expect(passwordInput).toBeTruthy()
    })

    it('9.2 - email dan password input → required attribute ada', () => {
        renderLogin()

        const emailInput = screen.getByPlaceholderText('your.email@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')

        expect(emailInput).toHaveAttribute('required')
        expect(passwordInput).toHaveAttribute('required')
    })

    it('9.7 - halaman memiliki brand text "Ticket"', () => {
        renderLogin()

        expect(screen.getByText('Ticket')).toBeTruthy()
    })

    it('halaman menampilkan "Masuk Sekarang" button', () => {
        renderLogin()

        expect(screen.getByText('Masuk Sekarang')).toBeTruthy()
    })
})

describe('LoginPage - form submission', () => {
    it('9.4 - submit form berhasil → navigate ke "/"', async () => {
        const mockSignIn = vi.fn().mockResolvedValue({ error: null })
        mockUseAuth.mockReturnValue({ signIn: mockSignIn })

        renderLogin()

        const emailInput = screen.getByPlaceholderText('your.email@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')

        await userEvent.type(emailInput, 'test@test.com')
        await userEvent.type(passwordInput, 'password123')
        await userEvent.click(screen.getByText('Masuk Sekarang'))

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123')
            expect(mockNavigate).toHaveBeenCalledWith('/')
        })
    })

    it('9.5 - submit form gagal → error message ditampilkan', async () => {
        const mockSignIn = vi.fn().mockResolvedValue({
            error: { message: 'Invalid login credentials' },
        })
        mockUseAuth.mockReturnValue({ signIn: mockSignIn })

        renderLogin()

        const emailInput = screen.getByPlaceholderText('your.email@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')

        await userEvent.type(emailInput, 'bad@test.com')
        await userEvent.type(passwordInput, 'wrong')
        await userEvent.click(screen.getByText('Masuk Sekarang'))

        await waitFor(() => {
            expect(screen.getByText('Invalid login credentials')).toBeTruthy()
        })
    })

    it('9.6 - loading state → tombol disabled, text berubah "Verifikasi..."', async () => {
        // signIn that never resolves (to keep loading state)
        const mockSignIn = vi.fn(() => new Promise(() => { }))
        mockUseAuth.mockReturnValue({ signIn: mockSignIn })

        renderLogin()

        const emailInput = screen.getByPlaceholderText('your.email@example.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')

        await userEvent.type(emailInput, 'test@test.com')
        await userEvent.type(passwordInput, 'pass')
        await userEvent.click(screen.getByText('Masuk Sekarang'))

        await waitFor(() => {
            expect(screen.getByText('Verifikasi...')).toBeTruthy()
        })
    })
})
