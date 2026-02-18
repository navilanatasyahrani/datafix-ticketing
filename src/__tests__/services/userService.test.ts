import { describe, it, expect, vi, beforeEach } from 'vitest'

// =============================================
// Mock Supabase client — using vi.hoisted
// =============================================
const { mockFrom, mockRpc } = vi.hoisted(() => {
    return {
        mockFrom: vi.fn(),
        mockRpc: vi.fn(),
    }
})

vi.mock('../../services/supabase', () => ({
    supabase: {
        from: mockFrom,
        rpc: mockRpc,
    },
}))

import { getAllUsers, updateUserProfile, createUser } from '../../services/userService'

// =============================================
// Modul 5: User Service
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
    chain.update = vi.fn(() => chain)
    chain.then = (resolve: any) => resolve(resolvedValue)
    return chain
}

describe('getAllUsers', () => {
    it('5.1 - select profiles dengan relasi branch dan region', async () => {
        const mockData = [
            { id: '1', full_name: 'Admin', role: 'admin', branch: { name: 'HQ' }, region: { region_name: 'Jakarta' } },
        ]

        const chain = chainable({ data: mockData, error: null })
        mockFrom.mockReturnValue(chain)

        const result = await getAllUsers()
        expect(mockFrom).toHaveBeenCalledWith('profiles')
        expect(result.data).toEqual(mockData)
    })

    it('saat error → return { data, error }', async () => {
        const chain = chainable({ data: null, error: { message: 'Error' } })
        mockFrom.mockReturnValue(chain)

        const result = await getAllUsers()
        expect(result.error).toBeTruthy()
    })
})

describe('updateUserProfile', () => {
    it('5.2 - update + select single → return data', async () => {
        const updatedProfile = { id: 'user-1', full_name: 'Updated Name', role: 'admin' }

        const chain = chainable({ data: updatedProfile, error: null })
        mockFrom.mockReturnValue(chain)

        const result = await updateUserProfile('user-1', { full_name: 'Updated Name' } as any)
        expect(mockFrom).toHaveBeenCalledWith('profiles')
        expect(chain.update).toHaveBeenCalled()
        expect(chain.eq).toHaveBeenCalledWith('id', 'user-1')
        expect(result.data).toEqual(updatedProfile)
    })

    it('saat error → return error', async () => {
        const chain = chainable({ data: null, error: { message: 'Failed' } })
        mockFrom.mockReturnValue(chain)

        const result = await updateUserProfile('user-1', { full_name: 'X' } as any)
        expect(result.error).toBeTruthy()
    })
})

describe('createUser', () => {
    it('5.3 - memanggil supabase.rpc("create_new_user") dengan parameter benar', async () => {
        mockRpc.mockResolvedValue({ data: 'user-id', error: null })

        await createUser({
            email: 'test@test.com',
            password: 'password123',
            full_name: 'Test User',
            role: 'admin',
        })

        expect(mockRpc).toHaveBeenCalledWith('create_new_user', {
            email: 'test@test.com',
            password: 'password123',
            full_name: 'Test User',
            role_name: 'admin',
        })
    })

    it('5.4 - mengirim 4 parameter: email, password, full_name, role_name', async () => {
        mockRpc.mockResolvedValue({ data: 'user-id', error: null })

        await createUser({
            email: 'new@email.com',
            password: 'pass',
            full_name: 'Name',
            role: 'OUTLET',
        })

        const rpcArgs = mockRpc.mock.calls[0]
        expect(rpcArgs[0]).toBe('create_new_user')
        expect(rpcArgs[1]).toHaveProperty('email', 'new@email.com')
        expect(rpcArgs[1]).toHaveProperty('password', 'pass')
        expect(rpcArgs[1]).toHaveProperty('full_name', 'Name')
        expect(rpcArgs[1]).toHaveProperty('role_name', 'OUTLET')
    })

    it('saat RPC error → return error', async () => {
        mockRpc.mockResolvedValue({ data: null, error: { message: 'Create failed' } })

        const result = await createUser({
            email: 'fail@test.com',
            password: 'pass',
            full_name: 'Fail',
            role: 'admin',
        })

        expect(result.error).toBeTruthy()
    })
})
