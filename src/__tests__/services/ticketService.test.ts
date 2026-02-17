import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================
// Mock Supabase client — using vi.hoisted to fix initialization order
// =============================================
const { mockFrom, mockRpc, mockUpload, mockGetPublicUrl } = vi.hoisted(() => {
    return {
        mockFrom: vi.fn(),
        mockRpc: vi.fn(),
        mockUpload: vi.fn(),
        mockGetPublicUrl: vi.fn(),
    }
})

vi.mock('../../services/supabase', () => ({
    supabase: {
        from: mockFrom,
        rpc: mockRpc,
        storage: {
            from: vi.fn(() => ({
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl,
            })),
        },
    },
}))

import {
    getTickets,
    getTicketById,
    createTicket,
    updateTicket,
    redirectTicket,
    deleteTicket,
    getTicketStats,
    addDetailLines,
    uploadAttachment,
} from '../../services/ticketService'
import { TicketStatus } from '../../types'

// =============================================
// Modul 3: Ticket Service
// =============================================

beforeEach(() => {
    vi.clearAllMocks()
})

// ---------- helper ----------
function chainable(resolvedValue: any) {
    const chain: any = {}
    chain.select = vi.fn(() => chain)
    chain.eq = vi.fn(() => chain)
    chain.order = vi.fn(() => chain)
    chain.single = vi.fn(() => chain)
    chain.insert = vi.fn(() => chain)
    chain.update = vi.fn(() => chain)
    chain.delete = vi.fn(() => chain)
    chain.then = (resolve: any) => resolve(resolvedValue)
    return chain
}

describe('getTickets', () => {
    it('3.1 - tanpa filter → memanggil select dan order tanpa eq tambahan', async () => {
        const mockData = [{ id: '1', status: 'open' }]
        mockFrom.mockReturnValue(chainable({ data: mockData, error: null }))

        const result = await getTickets()
        expect(mockFrom).toHaveBeenCalledWith('datafix_tickets')
        expect(result.data).toEqual(mockData)
        expect(result.error).toBeNull()
    })

    it('3.2 - dengan filter status → memanggil eq', async () => {
        const mockData = [{ id: '1', status: 'open' }]
        const chain = chainable({ data: mockData, error: null })
        mockFrom.mockReturnValue(chain)

        const result = await getTickets({ status: TicketStatus.OPEN })
        expect(mockFrom).toHaveBeenCalledWith('datafix_tickets')
        expect(chain.eq).toHaveBeenCalled()
    })

    it('3.3 - dengan banyak filter → semua eq dipanggil', async () => {
        const chain = chainable({ data: [], error: null })
        mockFrom.mockReturnValue(chain)

        await getTickets({
            status: TicketStatus.OPEN,
            branch_id: 'b1',
            assigned_to: 'user1',
            origin_region_id: 'r1',
            target_team: 'IT_SABANG',
            stage: 'new',
            current_queue: 'IT_SABANG'
        })

        // Should have called eq for each filter
        expect(chain.eq.mock.calls.length).toBeGreaterThanOrEqual(7)
    })

    it('3.4 - saat Supabase error → mengembalikan { data: null, error }', async () => {
        const mockError = { message: 'DB Error' }
        mockFrom.mockReturnValue(chainable({ data: null, error: mockError }))

        const result = await getTickets()
        expect(result.data).toBeNull()
        expect(result.error).toEqual(mockError)
    })

    it('saat exception thrown → catch mengembalikan { data: null, error }', async () => {
        mockFrom.mockImplementation(() => {
            throw new Error('Network error')
        })

        const result = await getTickets()
        expect(result.data).toBeNull()
        expect(result.error).toBeTruthy()
    })
})

describe('getTicketById', () => {
    it('3.5 - memanggil from().select().eq().single()', async () => {
        const mockData = { id: 'test-id', status: 'open' }
        const chain = chainable({ data: mockData, error: null })
        mockFrom.mockReturnValue(chain)

        const result = await getTicketById('test-id')
        expect(mockFrom).toHaveBeenCalledWith('datafix_tickets')
        expect(chain.eq).toHaveBeenCalledWith('id', 'test-id')
        expect(result.data).toEqual(mockData)
    })

    it('3.6 - saat error → mengembalikan { data: null, error }', async () => {
        mockFrom.mockImplementation(() => {
            throw new Error('Not found')
        })

        const result = await getTicketById('invalid-id')
        expect(result.data).toBeNull()
        expect(result.error).toBeTruthy()
    })
})

describe('createTicket', () => {
    it('3.7 - insert lalu fetch full ticket', async () => {
        const insertedId = 'new-ticket-id'
        const fullTicket = { id: insertedId, status: 'open', branch: { name: 'Test' } }

        let callCount = 0
        mockFrom.mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                // insert → select → single
                return chainable({ data: { id: insertedId }, error: null })
            }
            // re-fetch → select → eq → single
            return chainable({ data: fullTicket, error: null })
        })

        const result = await createTicket({ description: 'Test ticket' })
        expect(result.data).toEqual(fullTicket)
        expect(result.error).toBeNull()
    })

    it('3.8 - saat insert gagal → mengembalikan error', async () => {
        mockFrom.mockReturnValue(chainable({ data: null, error: { message: 'Insert failed' } }))

        const result = await createTicket({ description: 'Test' })
        expect(result.data).toBeNull()
        expect(result.error).toBeTruthy()
    })
})

describe('updateTicket', () => {
    it('3.9 - update lalu re-fetch', async () => {
        const updatedTicket = { id: 'test', status: 'done' }

        let callCount = 0
        mockFrom.mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return chainable({ error: null })
            }
            return chainable({ data: updatedTicket, error: null })
        })

        const result = await updateTicket('test', { status: 'done' as any })
        expect(result.data).toEqual(updatedTicket)
    })

    it('3.10 - saat update gagal → return error', async () => {
        mockFrom.mockReturnValue(chainable({ data: null, error: { message: 'Update failed' } }))

        const result = await updateTicket('test', { status: 'done' as any })
        expect(result.data).toBeNull()
        expect(result.error).toBeTruthy()
    })
})

describe('redirectTicket', () => {
    it('3.11 - memanggil supabase.rpc("redirect_ticket") dengan parameter benar', async () => {
        mockRpc.mockResolvedValue({ error: null })

        const result = await redirectTicket('ticket-123', 'IT_SABANG', 'IT_SABANG')
        expect(mockRpc).toHaveBeenCalledWith('redirect_ticket', {
            p_ticket_id: 'ticket-123',
            p_target_team: 'IT_SABANG',
            p_current_queue: 'IT_SABANG',
        })
        expect(result.error).toBeNull()
    })

    it('saat RPC error → return error', async () => {
        mockRpc.mockResolvedValue({ error: { message: 'RPC failed' } })

        const result = await redirectTicket('ticket-123', 'IT_SABANG', 'IT_SABANG')
        expect(result.error).toBeTruthy()
    })

    it('saat exception thrown → catch error', async () => {
        mockRpc.mockRejectedValue(new Error('Network'))

        const result = await redirectTicket('ticket-123', 'IT_SABANG', 'IT_SABANG')
        expect(result.error).toBeTruthy()
    })
})

describe('deleteTicket', () => {
    it('3.12 - menghapus detail_lines, status_history, attachments, lalu ticket', async () => {
        mockFrom.mockReturnValue(chainable({ error: null }))

        const result = await deleteTicket('test-id')

        // Harus memanggil from 4 kali (3 relasi + 1 ticket)
        expect(mockFrom).toHaveBeenCalledWith('ticket_detail_lines')
        expect(mockFrom).toHaveBeenCalledWith('ticket_status_history')
        expect(mockFrom).toHaveBeenCalledWith('ticket_attachments')
        expect(mockFrom).toHaveBeenCalledWith('datafix_tickets')
        expect(result.error).toBeNull()
    })

    it('3.13 - saat delete ticket gagal → return error', async () => {
        const ticketError = { message: 'Delete failed' }

        let callCount = 0
        mockFrom.mockImplementation(() => {
            callCount++
            if (callCount <= 3) {
                return chainable({ error: null })
            }
            return chainable({ error: ticketError })
        })

        const result = await deleteTicket('test-id')
        expect(result.error).toBeTruthy()
    })
})

describe('getTicketStats', () => {
    it('3.14 - memanggil supabase.rpc("get_ticket_stats")', async () => {
        const statsData = [{ total_tickets: 10, open_tickets: 5 }]
        mockRpc.mockResolvedValue({ data: statsData, error: null })

        const result = await getTicketStats()
        expect(mockRpc).toHaveBeenCalledWith('get_ticket_stats')
    })

    it('3.15 - saat RPC mengembalikan array → return data[0]', async () => {
        const statsData = [{ total_tickets: 10, open_tickets: 5 }]
        mockRpc.mockResolvedValue({ data: statsData, error: null })

        const result = await getTicketStats()
        expect(result.data).toEqual(statsData[0])
    })

    it('saat RPC error → return { data: null, error }', async () => {
        mockRpc.mockRejectedValue(new Error('RPC failed'))

        const result = await getTicketStats()
        expect(result.data).toBeNull()
    })
})

describe('addDetailLines', () => {
    it('3.16 - insert lines dengan ticket_id di-assign', async () => {
        const lines = [
            { side: 'wrong', item_name: 'Test', value: 'Wrong value' },
            { side: 'expected', item_name: 'Test', value: 'Right value' },
        ]

        const chain = chainable({ data: lines, error: null })
        mockFrom.mockReturnValue(chain)

        const result = await addDetailLines('ticket-123', lines)
        expect(mockFrom).toHaveBeenCalledWith('ticket_detail_lines')

        // Verify ticket_id was added to each line
        const insertedLines = chain.insert.mock.calls[0][0]
        insertedLines.forEach((line: any) => {
            expect(line.ticket_id).toBe('ticket-123')
        })
    })

    it('saat insert gagal → return { data: null, error }', async () => {
        mockFrom.mockImplementation(() => {
            throw new Error('Insert failed')
        })

        const result = await addDetailLines('ticket-123', [])
        expect(result.data).toBeNull()
        expect(result.error).toBeTruthy()
    })
})

describe('uploadAttachment', () => {
    it('3.17 - upload file ke storage lalu insert metadata', async () => {
        const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
        const publicUrl = 'https://storage.example.com/test.png'

        mockUpload.mockResolvedValue({ error: null })
        mockGetPublicUrl.mockReturnValue({ data: { publicUrl } })

        const mockAttachmentData = { id: 'att-1', file_path: publicUrl }
        mockFrom.mockReturnValue(chainable({ data: mockAttachmentData, error: null }))

        const result = await uploadAttachment('ticket-123', mockFile)
        expect(result.data).toEqual(mockAttachmentData)
    })

    it('3.18 - saat upload gagal → return error', async () => {
        const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
        mockUpload.mockResolvedValue({ error: { message: 'Upload failed' } })

        const result = await uploadAttachment('ticket-123', mockFile)
        expect(result.error).toBeTruthy()
    })
})
