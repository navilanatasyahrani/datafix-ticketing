import { describe, it, expect } from 'vitest'
import {
    formatDate,
    formatDateShort,
    formatRelativeTime,
    getStatusLabel,
    getStatusColor,
    getPriorityLabel,
    getPriorityColor,
    truncateText
} from '../../utils/formatters'

// =============================================
// Modul 2: Formatter Utilities
// =============================================

describe('formatDate', () => {
    it('2.1 - harus memformat tanggal dengan format "dd MMM yyyy HH:mm" (locale ID)', () => {
        const result = formatDate('2026-01-15T10:30:00')
        // Mengecek format umum: angka hari, bulan singkat, tahun, waktu
        expect(result).toMatch(/15/)
        expect(result).toMatch(/2026/)
        expect(result).toMatch(/10:30/)
    })
})

describe('formatDateShort', () => {
    it('2.2 - harus memformat tanggal pendek tanpa waktu', () => {
        const result = formatDateShort('2026-01-15')
        expect(result).toMatch(/15/)
        expect(result).toMatch(/2026/)
        // Tidak boleh ada waktu
        expect(result).not.toMatch(/\d{2}:\d{2}/)
    })
})

describe('formatRelativeTime', () => {
    it('2.3 - harus mengembalikan string relatif', () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 3)
        const result = formatRelativeTime(pastDate.toISOString())
        // Harus berupa string non-empty (format Indonesia)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })
})

describe('getStatusLabel', () => {
    it('2.4 - "open" harus mengembalikan "Dalam Antrean"', () => {
        expect(getStatusLabel('open')).toBe('Dalam Antrean')
    })

    it('2.5 - "in_progress" harus mengembalikan "In Progress"', () => {
        expect(getStatusLabel('in_progress')).toBe('In Progress')
    })

    it('2.6 - "done" harus mengembalikan "Selesai"', () => {
        expect(getStatusLabel('done')).toBe('Selesai')
    })

    it('2.7 - "rejected" harus mengembalikan "Rejected"', () => {
        expect(getStatusLabel('rejected')).toBe('Rejected')
    })

    it('2.8 - "pending" harus di-map ke "Dalam Antrean" (sama dgn open)', () => {
        expect(getStatusLabel('pending')).toBe('Dalam Antrean')
    })

    it('2.9 - status tidak dikenal harus fallback ke value asli', () => {
        expect(getStatusLabel('unknown_status')).toBe('unknown_status')
    })
})

describe('getStatusColor', () => {
    it('2.10 - "open" harus mengembalikan "gray"', () => {
        expect(getStatusColor('open')).toBe('gray')
    })

    it('2.11 - "in_progress" harus mengembalikan "blue"', () => {
        expect(getStatusColor('in_progress')).toBe('blue')
    })

    it('2.12 - "done" harus mengembalikan "green"', () => {
        expect(getStatusColor('done')).toBe('green')
    })

    it('2.13 - "rejected" harus mengembalikan "red"', () => {
        expect(getStatusColor('rejected')).toBe('red')
    })

    it('"pending" harus mengembalikan "gray" (sama dgn open)', () => {
        expect(getStatusColor('pending')).toBe('gray')
    })

    it('status tidak dikenal harus fallback ke "gray"', () => {
        expect(getStatusColor('random')).toBe('gray')
    })
})

describe('getPriorityLabel', () => {
    it('2.14 - priority 1 harus "High"', () => {
        expect(getPriorityLabel(1)).toBe('High')
    })

    it('2.15 - priority 2 harus "Medium"', () => {
        expect(getPriorityLabel(2)).toBe('Medium')
    })

    it('2.16 - priority 3 harus "Low"', () => {
        expect(getPriorityLabel(3)).toBe('Low')
    })

    it('2.17 - priority 0 (diluar range) harus "Unknown"', () => {
        expect(getPriorityLabel(0)).toBe('Unknown')
    })

    it('priority negatif harus "Unknown"', () => {
        expect(getPriorityLabel(-1)).toBe('Unknown')
    })
})

describe('getPriorityColor', () => {
    it('2.18 - priority 1 harus "red"', () => {
        expect(getPriorityColor(1)).toBe('red')
    })

    it('2.19 - priority 2 harus "orange"', () => {
        expect(getPriorityColor(2)).toBe('orange')
    })

    it('2.20 - priority 3 harus "green"', () => {
        expect(getPriorityColor(3)).toBe('green')
    })

    it('priority di luar range harus "gray"', () => {
        expect(getPriorityColor(0)).toBe('gray')
        expect(getPriorityColor(99)).toBe('gray')
    })
})

describe('truncateText', () => {
    it('2.21 - harus memotong teks lebih panjang dari maxLength dan tambah "..."', () => {
        expect(truncateText('Hello World', 5)).toBe('Hello...')
    })

    it('2.22 - teks lebih pendek dari maxLength tidak dipotong', () => {
        expect(truncateText('Hi', 10)).toBe('Hi')
    })

    it('2.23 - empty string tetap empty', () => {
        expect(truncateText('', 5)).toBe('')
    })

    it('teks sama panjang dengan maxLength tidak dipotong', () => {
        expect(truncateText('Hello', 5)).toBe('Hello')
    })

    it('maxLength 0 dengan teks non-empty harus dipotong', () => {
        expect(truncateText('Hi', 0)).toBe('...')
    })
})
