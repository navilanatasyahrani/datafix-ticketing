import { describe, it, expect } from 'vitest'
import { TicketStatus, UserRole, ROLE_LABELS } from '../../types'

// =============================================
// Modul 1: Types & Enums
// =============================================

describe('TicketStatus Enum', () => {
    it('1.1 - OPEN harus bernilai "open"', () => {
        expect(TicketStatus.OPEN).toBe('open')
    })

    it('1.2 - IN_PROGRESS harus bernilai "in_progress"', () => {
        expect(TicketStatus.IN_PROGRESS).toBe('in_progress')
    })

    it('1.3 - RESOLVED harus bernilai "done"', () => {
        expect(TicketStatus.RESOLVED).toBe('done')
    })

    it('1.4 - REJECTED harus bernilai "rejected"', () => {
        expect(TicketStatus.REJECTED).toBe('rejected')
    })

    it('1.5 - PENDING (deprecated) harus bernilai "pending"', () => {
        expect(TicketStatus.PENDING).toBe('pending')
    })
})

describe('UserRole Enum', () => {
    it('1.6 - ADMIN harus bernilai "admin"', () => {
        expect(UserRole.ADMIN).toBe('admin')
    })

    it('1.7 - harus memiliki 5 role', () => {
        const roles = Object.values(UserRole)
        expect(roles).toHaveLength(5)
        expect(roles).toContain('admin')
        expect(roles).toContain('ACCOUNTING_HO')
        expect(roles).toContain('OUTLET')
        expect(roles).toContain('FIN_ADMIN')
        expect(roles).toContain('IT_SABANG')
    })
})

describe('ROLE_LABELS', () => {
    it('1.8 - harus memetakan semua UserRole ke label', () => {
        const roleValues = Object.values(UserRole)
        roleValues.forEach(role => {
            expect(ROLE_LABELS[role]).toBeDefined()
            expect(typeof ROLE_LABELS[role]).toBe('string')
        })
    })

    it('1.9 - ADMIN harus memetakan ke "Super Admin"', () => {
        expect(ROLE_LABELS[UserRole.ADMIN]).toBe('Super Admin')
    })

    it('ACCOUNTING_HO harus memetakan ke "Accounting HO"', () => {
        expect(ROLE_LABELS[UserRole.ACCOUNTING_HO]).toBe('Accounting HO')
    })

    it('OUTLET harus memetakan ke "Outlet"', () => {
        expect(ROLE_LABELS[UserRole.OUTLET]).toBe('Outlet')
    })

    it('FIN_ADMIN harus memetakan ke "Finance Admin"', () => {
        expect(ROLE_LABELS[UserRole.FIN_ADMIN]).toBe('Finance Admin')
    })

    it('IT_SABANG harus memetakan ke "IT Sabang"', () => {
        expect(ROLE_LABELS[UserRole.IT_SABANG]).toBe('IT Sabang')
    })
})
