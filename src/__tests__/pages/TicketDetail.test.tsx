import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'

// =============================================
// Mock dependencies
// =============================================
const { mockUseAuth, mockNavigate, mockGetTicketById, mockUpdateTicket, mockRedirectTicket, mockDeleteTicket } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockNavigate: vi.fn(),
    mockGetTicketById: vi.fn(),
    mockUpdateTicket: vi.fn(),
    mockRedirectTicket: vi.fn(),
    mockDeleteTicket: vi.fn(),
}))

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: mockUseAuth,
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'test-ticket-id' }),
    }
})

vi.mock('../../services/ticketService', () => ({
    getTicketById: mockGetTicketById,
    updateTicket: mockUpdateTicket,
    redirectTicket: mockRedirectTicket,
    deleteTicket: mockDeleteTicket,
}))

vi.mock('../../utils/formatters', () => ({
    formatDate: (d: string) => d || '-',
    getStatusLabel: (s: string) => {
        const map: Record<string, string> = { open: 'Dalam Antrean', in_progress: 'Sedang Diproses', done: 'Selesai', rejected: 'Ditolak' }
        return map[s] || s
    },
    getPriorityLabel: (p: number) => {
        const map: Record<number, string> = { 1: 'Tinggi', 2: 'Sedang', 3: 'Rendah' }
        return map[p] || String(p)
    },
}))

vi.mock('../../components/Layout', () => ({
    default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}))

import TicketDetail from '../../pages/TicketDetail'
import { MemoryRouter } from 'react-router-dom'

// =============================================
// Modul 12: TicketDetail
// =============================================

const sampleTicket = {
    id: 'test-ticket-id',
    status: 'open',
    issue_type: 'data_entry_error',
    description: 'Some description text',
    created_at: '2026-01-15T10:00:00',
    updated_at: '2026-01-16T10:00:00',
    wrong_input_date: '2026-01-10',
    branch: { name: 'Branch A' },
    feature: { name: 'Feature X' },
    feature_other: null,
    inputter_name: 'John Doe',
    priority: 1,
    fix_description: 'Fix applied',
    target_team: 'FIN_REGION',
    current_queue: 'FIN_ADMIN',
    origin_region_id: 'reg-1',
    origin_region: { region_name: 'Region Satu' },
    detail_lines: [
        { side: 'wrong', item_name: 'Deskripsi Salah', value: 'Wrong data here' },
        { side: 'expected', item_name: 'Deskripsi Benar', value: 'Correct data here' },
    ],
    attachments: [],
    assigned_to: 'Haris Wijayanto',
    reporter: { full_name: 'Jane Reporter' },
    reporter_name: 'Jane',
    stage: null,
    triaged_at: null,
    redirected_at: null,
}

beforeEach(() => {
    vi.clearAllMocks()

    mockUseAuth.mockReturnValue({
        isAdmin: true,
        canManageTickets: true,
        userRole: 'admin',
    })

    mockGetTicketById.mockResolvedValue({ data: sampleTicket })
    mockUpdateTicket.mockResolvedValue({ error: null })
    mockRedirectTicket.mockResolvedValue({ error: null })
    mockDeleteTicket.mockResolvedValue({ error: null })

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true)
})

function renderTicketDetail() {
    return render(
        <MemoryRouter>
            <TicketDetail />
        </MemoryRouter>
    )
}

describe('TicketDetail - loading', () => {
    it('12.1 - loading state → spinner ditampilkan', () => {
        mockGetTicketById.mockReturnValue(new Promise(() => { }))
        renderTicketDetail()

        const spinner = document.querySelector('.animate-spin')
        expect(spinner).toBeTruthy()
    })
})

describe('TicketDetail - not found', () => {
    it('12.2 - Ticket not found → pesan error ditampilkan', async () => {
        mockGetTicketById.mockResolvedValue({ data: null })

        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('Ticket not found')).toBeTruthy()
        })
    })
})

describe('TicketDetail - ticket info', () => {
    it('12.3 - Render ticket info: tipe masalah, cabang, fitur, PIC, deskripsi', async () => {
        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('Ticket Information')).toBeTruthy()
        })
        expect(screen.getByText('Kesalahan Entri Data')).toBeTruthy() // ISSUE_TYPE_LABELS
        expect(screen.getByText('Branch A')).toBeTruthy()
        expect(screen.getByText('Feature X')).toBeTruthy()
        expect(screen.getByText('John Doe')).toBeTruthy()
        expect(screen.getByText('Some description text')).toBeTruthy()
    })

    it('12.4 - Feature "Lainnya" → tampilkan feature_other', async () => {
        const ticketWithOther = { ...sampleTicket, feature: { name: 'Lainnya' }, feature_other: 'My Custom Feature' }
        mockGetTicketById.mockResolvedValue({ data: ticketWithOther })

        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('My Custom Feature')).toBeTruthy()
        })
    })

    it('12.17 - Detail baris: Data Salah & Data Benar dari detail_lines', async () => {
        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('Ticket Information')).toBeTruthy()
        })
        const textareas = document.querySelectorAll('textarea[readonly]')
        const values = Array.from(textareas).map(t => (t as HTMLTextAreaElement).value)
        expect(values).toContain('Wrong data here')
        expect(values).toContain('Correct data here')
    })
})

describe('TicketDetail - buttons visibility', () => {
    it('12.6 - "Edit" button tampil jika canEdit', async () => {
        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('Edit')).toBeTruthy()
        })
    })

    it('12.6b - "Edit" button TIDAK tampil jika !canManageTickets dan !isAdmin', async () => {
        mockUseAuth.mockReturnValue({
            isAdmin: false,
            canManageTickets: false,
            userRole: 'OUTLET',
        })

        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('Ticket Information')).toBeTruthy()
        })

        expect(screen.queryByText('Edit')).toBeNull()
    })

    it('12.7 - "Hapus" button hanya tampil untuk admin', async () => {
        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('Hapus')).toBeTruthy()
        })
    })

    it('12.7b - "Hapus" button TIDAK tampil untuk non-admin', async () => {
        mockUseAuth.mockReturnValue({
            isAdmin: false,
            canManageTickets: true,
            userRole: 'ACCOUNTING_HO',
        })

        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('Ticket Information')).toBeTruthy()
        })

        expect(screen.queryByText('Hapus')).toBeNull()
    })
})

describe('TicketDetail - edit mode', () => {
    it('12.8 - Edit mode → form status & fix_description tersedia', async () => {
        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('Edit')).toBeTruthy()
        })

        fireEvent.click(screen.getByText('Edit'))

        await waitFor(() => {
            // Save button appears in edit mode
            expect(screen.getByText('Save')).toBeTruthy()
            // Cancel button too
            expect(screen.getByText('Cancel')).toBeTruthy()
        })
    })
})

describe('TicketDetail - handleSave', () => {
    it('12.13 - handleSave saat target_team tidak berubah → hanya panggil updateTicket()', async () => {
        renderTicketDetail()

        await waitFor(() => { expect(screen.getByText('Edit')).toBeTruthy() })
        fireEvent.click(screen.getByText('Edit'))

        await waitFor(() => {
            expect(screen.getByText('Save')).toBeTruthy()
        })

        fireEvent.click(screen.getByText('Save'))

        await waitFor(() => {
            expect(mockUpdateTicket).toHaveBeenCalled()
            expect(mockRedirectTicket).not.toHaveBeenCalled()
        })
    })

    it('12.14 - handleSave berhasil → reload ticket', async () => {
        mockGetTicketById.mockResolvedValue({ data: sampleTicket })

        renderTicketDetail()

        await waitFor(() => { expect(screen.getByText('Edit')).toBeTruthy() })
        fireEvent.click(screen.getByText('Edit'))

        await waitFor(() => {
            expect(screen.getByText('Save')).toBeTruthy()
        })

        fireEvent.click(screen.getByText('Save'))

        await waitFor(() => {
            // Should have called getTicketById twice: initial load + after save
            expect(mockGetTicketById).toHaveBeenCalledTimes(2)
        })
    })

    it('12.15 - handleSave berhasil tapi ticket hilang (RLS) → navigate ke /tickets', async () => {
        mockGetTicketById
            .mockResolvedValueOnce({ data: sampleTicket })
            .mockResolvedValueOnce({ data: null })

        renderTicketDetail()

        await waitFor(() => { expect(screen.getByText('Edit')).toBeTruthy() })
        fireEvent.click(screen.getByText('Edit'))

        await waitFor(() => {
            expect(screen.getByText('Save')).toBeTruthy()
        })

        fireEvent.click(screen.getByText('Save'))

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/tickets')
        })
    })
})

describe('TicketDetail - handleDelete', () => {
    it('12.16 - handleDelete → konfirmasi → deleteTicket() → navigate /tickets', async () => {
        renderTicketDetail()

        await waitFor(() => {
            expect(screen.getByText('Hapus')).toBeTruthy()
        })

        fireEvent.click(screen.getByText('Hapus'))

        await waitFor(() => {
            expect(mockDeleteTicket).toHaveBeenCalledWith('test-ticket-id')
            expect(mockNavigate).toHaveBeenCalledWith('/tickets')
        })
    })
})

describe('TicketDetail - constants', () => {
    it('12.20 - ISSUE_TYPE_LABELS mapping correct', async () => {
        renderTicketDetail()

        await waitFor(() => {
            // 'data_entry_error' → 'Kesalahan Entri Data'
            expect(screen.getByText('Kesalahan Entri Data')).toBeTruthy()
        })
    })
})
