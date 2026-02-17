import { describe, it, expect } from 'vitest'
import { ASSIGNEES } from '../../constants/assignees'

// =============================================
// Modul 16: Constants — Assignees
// =============================================

describe('ASSIGNEES constant', () => {
    it('16.1 - ASSIGNEES adalah array string', () => {
        expect(Array.isArray(ASSIGNEES)).toBe(true)
        ASSIGNEES.forEach(a => expect(typeof a).toBe('string'))
    })

    it('16.2 - ASSIGNEES memiliki 9 entries', () => {
        expect(ASSIGNEES).toHaveLength(9)
    })

    it('16.3 - Semua entries non-empty string', () => {
        ASSIGNEES.forEach(a => {
            expect(a.trim().length).toBeGreaterThan(0)
        })
    })
})
