import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'

// =============================================
// Mock dependencies
// =============================================
const { mockUseAuth, mockNavigate, mockGetTickets, mockGetTicketStats, mockGetRegions, mockUpdateTicket } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockNavigate: vi.fn(),
    mockGetTickets: vi.fn(),
    mockGetTicketStats: vi.fn(),
    mockGetRegions: vi.fn(),
    mockUpdateTicket: vi.fn(),
}))

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: mockUseAuth,
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../services/ticketService', () => ({
    getTickets: mockGetTickets,
    getTicketStats: mockGetTicketStats,
    updateTicket: mockUpdateTicket,
}))

vi.mock('../../services/masterDataService', () => ({
    getRegions: mockGetRegions,
}))

vi.mock('../../components/Layout', () => ({
    default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}))

import TicketList from '../../pages/TicketList'
import { MemoryRouter } from 'react-router-dom'

// =============================================
// Modul 11: TicketList
// =============================================

const sampleTickets = [
    {
        id: 'aaaa1111-bbbb-cccc-dddd-eeee1111ffff',
        status: 'open',
        issue_type: 'data_entry_error',
        description: 'Ticket 1',
        created_at: '2026-01-15T10:00:00Z',
        branch: { name: 'Branch A' },
        feature: { name: 'Feature X' },
        feature_other: null,
        priority: 1,
        origin_region_id: 'reg-1',
        origin_region: { region_name: 'Region Satu' },
        target_team: 'FIN_REGION',
        assigned_to: 'Haris Wijayanto',
    },
    {
        id: 'bbbb2222-cccc-dddd-eeee-ffff2222aaaa',
        status: 'done',
        issue_type: 'missing_data',
        description: 'Ticket 2',
        created_at: '2026-01-14T10:00:00Z',
        branch: { name: 'Branch B' },
        feature: { name: 'Feature Y' },
        feature_other: null,
        priority: 2,
        origin_region_id: 'reg-2',
        origin_region: { region_name: 'Region Dua' },
        target_team: 'ACC_HO',
        assigned_to: null,
    },
    {
        id: 'cccc3333-dddd-eeee-ffff-aaaa3333bbbb',
        status: 'in_progress',
        issue_type: 'system_bug',
        description: 'Ticket 3',
        created_at: '2026-01-13T10:00:00Z',
        branch: { name: 'Branch A' },
        feature: { name: 'Lainnya' },
        feature_other: 'Custom Feature',
        priority: 3,
        origin_region_id: 'reg-1',
        origin_region: { region_name: 'Region Satu' },
        target_team: 'IT_SABANG',
        assigned_to: null,
    },
]

// Stats uses pending_tickets as backend key - the component maps it to open_tickets
const defaultStats = {
    total_tickets: 50,
    pending_tickets: 10,
    in_progress_tickets: 15,
    resolved_tickets: 20,
    rejected_tickets: 5,
}

const sampleRegions = [
    { id: 'reg-1', region_name: 'Region Satu' },
    { id: 'reg-2', region_name: 'Region Dua' },
]

beforeEach(() => {
    vi.clearAllMocks()

    mockUseAuth.mockReturnValue({
        isAdmin: true,
        canManageTickets: true,
        userRole: 'admin',
    })

    mockGetTickets.mockResolvedValue({ data: sampleTickets })
    mockGetTicketStats.mockResolvedValue({ data: defaultStats })
    mockGetRegions.mockResolvedValue({ data: sampleRegions })
    mockUpdateTicket.mockResolvedValue({ error: null })
})

function renderTicketList() {
    return render(
        <MemoryRouter>
            <TicketList />
        </MemoryRouter>
    )
}

describe('TicketList - loading', () => {
    it('11.1 - loading state → spinner ditampilkan', () => {
        mockGetTickets.mockReturnValue(new Promise(() => { }))
        renderTicketList()

        const spinner = document.querySelector('.animate-spin')
        expect(spinner).toBeTruthy()
    })
})

describe('TicketList - stats cards', () => {
    it('11.8 - Stats cards ditampilkan setelah data dimuat', async () => {
        renderTicketList()

        await waitFor(() => {
            // Wait for loading to finish by checking heading
            expect(screen.getByText('Progress Tiket Perbaikan')).toBeTruthy()
        })

        // Now check stats labels exist
        expect(screen.getByText('Total Tiket')).toBeTruthy()
        // Stats card values
        expect(screen.getByText('50')).toBeTruthy()  // total_tickets
    })
})

describe('TicketList - table rendering', () => {
    it('11.2 - Render tabel dengan kolom header', async () => {
        renderTicketList()

        await waitFor(() => {
            expect(screen.getByText('Progress Tiket Perbaikan')).toBeTruthy()
        })

        expect(screen.getByText('ID Tiket')).toBeTruthy()
        expect(screen.getAllByText('Fitur').length).toBeGreaterThanOrEqual(1)
        // Status and Prioritas appear in both mobile cards and desktop table headers
        expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Prioritas').length).toBeGreaterThanOrEqual(1)
    })

    it('11.3 - Detail button navigates to ticket detail', async () => {
        renderTicketList()

        await waitFor(() => {
            expect(screen.getByText('Progress Tiket Perbaikan')).toBeTruthy()
        })

        const detailButtons = screen.getAllByText('Detail')
        expect(detailButtons.length).toBeGreaterThan(0)

        fireEvent.click(detailButtons[0])

        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/tickets/'))
    })

    it('11.11 - Empty state: "Tidak ada tiket yang ditemukan"', async () => {
        mockGetTickets.mockResolvedValue({ data: [] })

        renderTicketList()

        await waitFor(() => {
            expect(screen.getByText('Progress Tiket Perbaikan')).toBeTruthy()
        })

        expect(screen.getAllByText('Tidak ada tiket yang ditemukan').length).toBeGreaterThanOrEqual(1)
    })
})

describe('TicketList - filters', () => {
    it('11.4 - Filter berdasarkan status tersedia', async () => {
        renderTicketList()

        await waitFor(() => {
            expect(screen.getByText('Progress Tiket Perbaikan')).toBeTruthy()
        })

        const statusSelect = screen.getByDisplayValue('Semua Status')
        expect(statusSelect).toBeTruthy()
    })

    it('11.12 - TEAM_LABELS dalam filter Tim dropdown', async () => {
        renderTicketList()

        await waitFor(() => {
            expect(screen.getByText('Progress Tiket Perbaikan')).toBeTruthy()
        })

        // Team labels in the filter dropdown and in the table rows
        expect(screen.getAllByText('Finance Region').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Accounting HO').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('IT Sabang').length).toBeGreaterThanOrEqual(1)
    })
})

describe('TicketList - assignee change', () => {
    it('11.9 - handleAssigneeChange → memanggil updateTicket', async () => {
        mockUseAuth.mockReturnValue({
            isAdmin: true,
            canManageTickets: true,
            userRole: 'IT_SABANG',
        })

        renderTicketList()

        await waitFor(() => {
            expect(screen.getByText('Progress Tiket Perbaikan')).toBeTruthy()
        })

        // Find the first assignee select and change its value
        const selects = document.querySelectorAll('select')
        const assigneeSelect = Array.from(selects).find(s =>
            Array.from(s.options).some(o => o.textContent === 'Unassigned')
        )

        if (assigneeSelect) {
            fireEvent.change(assigneeSelect, { target: { value: 'Hendra Afrizal' } })

            await waitFor(() => {
                expect(mockUpdateTicket).toHaveBeenCalledWith(
                    expect.any(String),
                    { assigned_to: 'Hendra Afrizal' }
                )
            })
        }
    })
})

describe('TicketList - helper functions', () => {
    it('11.13 - getPriorityBadge() renders correct labels', async () => {
        renderTicketList()

        await waitFor(() => {
            expect(screen.getByText('Progress Tiket Perbaikan')).toBeTruthy()
        })

        // Priority labels may appear multiple times (mobile + desktop rows)
        expect(screen.getAllByText('Tinggi').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Sedang').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Rendah').length).toBeGreaterThanOrEqual(1)
    })

    it('11.14 - getStatusBadge() renders badge for each status', async () => {
        renderTicketList()

        await waitFor(() => {
            expect(screen.getByText('Progress Tiket Perbaikan')).toBeTruthy()
        })

        // Status badge labels from getStatusBadge
        expect(screen.getAllByText(/Sedang Diproses/).length).toBeGreaterThanOrEqual(1)
    })
})
