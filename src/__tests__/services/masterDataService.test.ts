import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================
// Mock Supabase client — using vi.hoisted
// =============================================
const { mockFrom } = vi.hoisted(() => {
    return { mockFrom: vi.fn() }
})

vi.mock('../../services/supabase', () => ({
    supabase: {
        from: mockFrom,
    },
}))

import { getBranches, getAllFeatures, getRegions } from '../../services/masterDataService'

// =============================================
// Modul 4: Master Data Service
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
    chain.then = (resolve: any) => resolve(resolvedValue)
    return chain
}

describe('getBranches', () => {
    it('4.1 - query m_branches, filter is_active=true, order by name', async () => {
        const mockData = [
            { id: '1', name: 'Branch A', is_active: true },
            { id: '2', name: 'Branch B', is_active: true },
        ]

        const chain = chainable({ data: mockData, error: null })
        mockFrom.mockReturnValue(chain)

        const result = await getBranches()
        expect(mockFrom).toHaveBeenCalledWith('m_branches')
        expect(chain.eq).toHaveBeenCalledWith('is_active', true)
        expect(chain.order).toHaveBeenCalledWith('name')
        expect(result.data).toEqual(mockData)
        expect(result.error).toBeNull()
    })

    it('4.2 - saat error → return { data: null, error }', async () => {
        mockFrom.mockImplementation(() => {
            throw new Error('DB error')
        })

        const result = await getBranches()
        expect(result.data).toBeNull()
        expect(result.error).toBeTruthy()
    })
})

describe('getAllFeatures', () => {
    it('4.3 - fitur "Lainnya" selalu di akhir array', async () => {
        const mockData = [
            { id: '2', name: 'Alphonso', is_active: true },
            { id: '1', name: 'Lainnya', is_active: true },
            { id: '3', name: 'Zebra', is_active: true },
        ]

        const chain = chainable({ data: [...mockData], error: null })
        mockFrom.mockReturnValue(chain)

        const result = await getAllFeatures()

        if (result.data && result.data.length > 0) {
            const lastItem = result.data[result.data.length - 1]
            expect(lastItem.name).toBe('Lainnya')
        }
    })

    it('4.4 - order alphabetical kecuali "Lainnya"', async () => {
        const mockData = [
            { id: '1', name: 'Charlie', is_active: true },
            { id: '2', name: 'Alpha', is_active: true },
            { id: '3', name: 'Lainnya', is_active: true },
            { id: '4', name: 'Beta', is_active: true },
        ]

        const chain = chainable({ data: [...mockData], error: null })
        mockFrom.mockReturnValue(chain)

        const result = await getAllFeatures()

        if (result.data && result.data.length > 1) {
            const nonLainnya = result.data.filter((f: any) => f.name !== 'Lainnya')
            for (let i = 0; i < nonLainnya.length - 1; i++) {
                expect(
                    nonLainnya[i].name.localeCompare(nonLainnya[i + 1].name)
                ).toBeLessThanOrEqual(0)
            }
            expect(result.data[result.data.length - 1].name).toBe('Lainnya')
        }
    })

    it('saat error → return { data: null, error }', async () => {
        mockFrom.mockImplementation(() => {
            throw new Error('DB error')
        })

        const result = await getAllFeatures()
        expect(result.data).toBeNull()
        expect(result.error).toBeTruthy()
    })
})

describe('getRegions', () => {
    it('4.5 - query m_regions, order by region_name', async () => {
        const mockData = [
            { id: '1', region_name: 'Jakarta', region_code: 1 },
            { id: '2', region_name: 'Surabaya', region_code: 2 },
        ]

        const chain = chainable({ data: mockData, error: null })
        mockFrom.mockReturnValue(chain)

        const result = await getRegions()
        expect(mockFrom).toHaveBeenCalledWith('m_regions')
        expect(chain.order).toHaveBeenCalledWith('region_name')
        expect(result.data).toEqual(mockData)
        expect(result.error).toBeNull()
    })

    it('4.6 - saat error → return { data: null, error }', async () => {
        mockFrom.mockImplementation(() => {
            throw new Error('DB error')
        })

        const result = await getRegions()
        expect(result.data).toBeNull()
        expect(result.error).toBeTruthy()
    })
})
