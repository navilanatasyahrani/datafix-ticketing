import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// =============================================
// Mock dependencies
// =============================================
const { mockUseAuth, mockNavigate, mockGetTicketStats, mockGetTickets } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockNavigate: vi.fn(),
    mockGetTicketStats: vi.fn(),
    mockGetTickets: vi.fn(),
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

vi.mock('../../services/ticketService', () => ({
    getTicketStats: mockGetTicketStats,
    getTickets: mockGetTickets,
}))

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div />,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => <div />,
    Cell: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}))

// Mock Layout component
vi.mock('../../components/Layout', () => ({
    default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}))

import Dashboard from '../../pages/Dashboard'
import { MemoryRouter } from 'react-router-dom'

// =============================================
// Modul 10: Dashboard
// =============================================

const defaultStats = {
    total_tickets: 50,
    open_tickets: 10,
    in_progress_tickets: 15,
    resolved_tickets: 20,
    rejected_tickets: 5,
}

const sampleTickets = [
    {
        id: 'aaaa1111-bbbb-cccc-dddd-eeee1111ffff',
        status: 'open',
        issue_type: 'Data Error',
        description: 'Ticket 1',
        created_at: '2026-01-15T10:00:00',
        branch: { name: 'Branch A' },
        feature: { name: 'Feature X' },
        reporter: { full_name: 'John Doe' },
        reporter_name: 'John',
        priority: 1,
    },
    {
        id: 'bbbb2222-cccc-dddd-eeee-ffff2222aaaa',
        status: 'done',
        issue_type: 'Wrong Input',
        description: 'Ticket 2',
        created_at: '2026-01-14T10:00:00',
        branch: { name: 'Branch B' },
        feature: { name: 'Feature Y' },
        reporter: { full_name: 'Jane Doe' },
        reporter_name: 'Jane',
        priority: 2,
    },
    {
        id: 'cccc3333-dddd-eeee-ffff-aaaa3333bbbb',
        status: 'in_progress',
        issue_type: 'Missing Data',
        description: 'Ticket 3',
        created_at: '2026-01-13T10:00:00',
        branch: { name: 'Branch A' },
        feature: { name: 'Feature X' },
        reporter: { full_name: 'Alice' },
        reporter_name: 'Alice',
        priority: 3,
    },
]

beforeEach(() => {
    vi.clearAllMocks()

    mockUseAuth.mockReturnValue({
        profile: { display_name: 'Admin User', full_name: 'Admin', email: 'admin@test.com' },
        isAdmin: true,
    })

    mockGetTicketStats.mockResolvedValue({ data: defaultStats })
    mockGetTickets.mockResolvedValue({ data: sampleTickets })
})

function renderDashboard() {
    return render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    )
}

describe('Dashboard - loading', () => {
    it('10.1 - loading state → spinner ditampilkan', () => {
        // Make the stats never resolve to keep loading
        mockGetTicketStats.mockReturnValue(new Promise(() => { }))

        renderDashboard()

        const spinner = document.querySelector('.animate-spin')
        expect(spinner).toBeTruthy()
    })
})

describe('Dashboard - welcome message', () => {
    it('10.2 - render welcome → display_name ditampilkan', async () => {
        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText(/Admin User/)).toBeTruthy()
        })
    })

    it('fallback ke full_name jika display_name tidak ada', async () => {
        mockUseAuth.mockReturnValue({
            profile: { full_name: 'Full Name Test', email: 'test@test.com' },
            isAdmin: false,
        })

        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText(/Full Name Test/)).toBeTruthy()
        })
    })

    it('fallback ke email jika full_name tidak ada', async () => {
        mockUseAuth.mockReturnValue({
            profile: { email: 'email@test.com' },
            isAdmin: false,
        })

        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText(/email@test.com/)).toBeTruthy()
        })
    })

    it('fallback ke "User" jika semua tidak ada', async () => {
        mockUseAuth.mockReturnValue({
            profile: {},
            isAdmin: false,
        })

        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText(/Welcome back/)).toBeTruthy()
        })
    })
})

describe('Dashboard - stats cards', () => {
    it('10.3 - Stats cards: Total Submissions, Active Requests, Success Rate', async () => {
        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText('Total Submissions')).toBeTruthy()
            expect(screen.getByText('Active Requests')).toBeTruthy()
            expect(screen.getByText('Success Rate')).toBeTruthy()
        })
    })

    it('10.4 - Active Requests = open + in_progress', async () => {
        renderDashboard()

        await waitFor(() => {
            // open_tickets (10) + in_progress_tickets (15) = 25
            expect(screen.getByText('25')).toBeTruthy()
        })
    })

    it('10.5 - Success Rate = (resolved / total * 100) dengan 1 desimal', async () => {
        renderDashboard()

        await waitFor(() => {
            // 20 / 50 * 100 = 40.0%
            expect(screen.getByText('40.0%')).toBeTruthy()
        })
    })

    it('10.6 - Success Rate saat total = 0 → "0.0%"', async () => {
        mockGetTicketStats.mockResolvedValue({
            data: { total_tickets: 0, open_tickets: 0, in_progress_tickets: 0, resolved_tickets: 0, rejected_tickets: 0 },
        })

        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText('0.0%')).toBeTruthy()
        })
    })

    it('10.17 - Stats mapping: pending_tickets → open_tickets (compat)', async () => {
        mockGetTicketStats.mockResolvedValue({
            data: { total_tickets: 10, pending_tickets: 7, in_progress_tickets: 2, resolved_tickets: 1, rejected_tickets: 0 },
        })

        renderDashboard()

        await waitFor(() => {
            // Active = pending_tickets (7) + in_progress(2) = 9
            expect(screen.getByText('9')).toBeTruthy()
        })
    })
})

describe('Dashboard - charts (admin-only)', () => {
    it('10.7 - Charts tampil untuk admin (isAdmin === true)', async () => {
        mockUseAuth.mockReturnValue({
            profile: { display_name: 'Admin' },
            isAdmin: true,
        })

        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText('Tren Perbaikan Data')).toBeTruthy()
        })
    })

    it('10.8 - Charts TIDAK tampil untuk non-admin', async () => {
        mockUseAuth.mockReturnValue({
            profile: { display_name: 'Outlet User' },
            isAdmin: false,
        })

        renderDashboard()

        await waitFor(() => {
            // Should still load the page without charts
            expect(screen.getByText('Total Submissions')).toBeTruthy()
        })

        // Chart titles should not be present
        expect(screen.queryByText('Tren Perbaikan Data')).toBeNull()
    })
})

describe('Dashboard - navigation buttons', () => {
    it('10.10 - klik "New Ticket" → navigate ke /tickets/new', async () => {
        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText('New Ticket')).toBeTruthy()
        })

        await userEvent.click(screen.getByText('New Ticket'))
        expect(mockNavigate).toHaveBeenCalledWith('/tickets/new')
    })

    it('10.11 - klik "View All" → navigate ke /tickets', async () => {
        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText('View All')).toBeTruthy()
        })

        await userEvent.click(screen.getByText('View All'))
        expect(mockNavigate).toHaveBeenCalledWith('/tickets')
    })
})

describe('Dashboard - recent activities', () => {
    it('10.9 - recent activities table → shows ticket data', async () => {
        renderDashboard()

        await waitFor(() => {
            // Should show "Recent Activities" header
            expect(screen.getByText('Recent Activities')).toBeTruthy()
            // Should show feature names from tickets (Feature X appears in 2 tickets)
            expect(screen.getAllByText('Feature X').length).toBeGreaterThanOrEqual(1)
        })
    })

    it('10.12 - empty state → "No tickets found"', async () => {
        mockGetTickets.mockResolvedValue({ data: [] })

        renderDashboard()

        await waitFor(() => {
            expect(screen.getByText('No tickets found')).toBeTruthy()
        })
    })
})
