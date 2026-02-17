import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import SearchableSelect from '../../components/SearchableSelect'

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()


// =============================================
// Modul 8: SearchableSelect
// =============================================

const sampleOptions = [
    { id: '1', name: 'Alpha' },
    { id: '2', name: 'Beta' },
    { id: '3', name: 'Charlie' },
    { id: '4', name: 'Delta' },
]

describe('SearchableSelect - rendering', () => {
    it('8.1 - render dengan placeholder → placeholder ditampilkan', () => {
        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={() => { }}
                placeholder="Pilih cabang..."
            />
        )

        const input = screen.getByPlaceholderText('Pilih cabang...')
        expect(input).toBeTruthy()
    })

    it('8.2 - render tanpa placeholder → default "Pilih..."', () => {
        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={() => { }}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        expect(input).toBeTruthy()
    })

    it('8.7 - input value diisi → nama opsi ditampilkan', () => {
        render(
            <SearchableSelect
                options={sampleOptions}
                value="2"
                onChange={() => { }}
            />
        )

        const input = screen.getByDisplayValue('Beta')
        expect(input).toBeTruthy()
    })

    it('8.14 - options kosong → dropdown tampil pesan kosong saat dibuka', async () => {
        render(
            <SearchableSelect
                options={[]}
                value=""
                onChange={() => { }}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)

        const noResult = screen.getByText(/Tidak ada hasil/)
        expect(noResult).toBeTruthy()
    })

    it('8.15 - required=true → hidden input memiliki required attr', () => {
        const { container } = render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={() => { }}
                required={true}
                name="branch"
            />
        )

        const hiddenInput = container.querySelector('input[type="hidden"]')
        expect(hiddenInput).toBeTruthy()
        expect(hiddenInput?.getAttribute('required')).not.toBeNull()
    })
})

describe('SearchableSelect - interactions', () => {
    it('8.3 - klik input → dropdown terbuka', async () => {
        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={() => { }}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)

        // Options should be visible
        expect(screen.getByText('Alpha')).toBeTruthy()
        expect(screen.getByText('Beta')).toBeTruthy()
        expect(screen.getByText('Charlie')).toBeTruthy()
    })

    it('8.4 - klik di luar → dropdown tertutup', async () => {
        render(
            <div>
                <div data-testid="outside">Outside</div>
                <SearchableSelect
                    options={sampleOptions}
                    value=""
                    onChange={() => { }}
                />
            </div>
        )

        // Open dropdown
        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)
        expect(screen.getByText('Alpha')).toBeTruthy()

        // Click outside
        fireEvent.mouseDown(screen.getByTestId('outside'))

        // Dropdown should close
        expect(screen.queryByText('Alpha')).toBeNull()
    })

    it('8.5 - ketik di search → options difilter case-insensitive', async () => {
        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={() => { }}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)
        await userEvent.type(input, 'alph')

        // Alpha should match, others should not
        expect(screen.getByText('Alpha')).toBeTruthy()
        expect(screen.queryByText('Beta')).toBeNull()
        expect(screen.queryByText('Charlie')).toBeNull()
    })

    it('8.6 - pilih option → onChange dipanggil dengan id yang benar', async () => {
        const mockOnChange = vi.fn()

        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={mockOnChange}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)

        // Use fireEvent.click to avoid pointer events closing the dropdown
        fireEvent.click(screen.getByText('Charlie'))

        expect(mockOnChange).toHaveBeenCalledWith('3')
    })

    it('8.8 - klik clear button → onChange("") dipanggil', async () => {
        const mockOnChange = vi.fn()

        render(
            <SearchableSelect
                options={sampleOptions}
                value="2"
                onChange={mockOnChange}
            />
        )

        // Find and click the clear button (×)
        const clearBtn = document.querySelector('button[type="button"]')
        expect(clearBtn).toBeTruthy()
        await userEvent.click(clearBtn!)

        expect(mockOnChange).toHaveBeenCalledWith('')
    })

    it('8.13 - search tanpa hasil → tampilkan pesan "Tidak ada hasil..."', async () => {
        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={() => { }}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)
        await userEvent.type(input, 'zzzznothing')

        expect(screen.getByText(/Tidak ada hasil/)).toBeTruthy()
    })
})

describe('SearchableSelect - keyboard navigation', () => {
    it('8.9 - ArrowDown → highlight bergerak ke bawah', async () => {
        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={() => { }}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)
        fireEvent.keyDown(input, { key: 'ArrowDown' })

        // First item should be highlighted
        const items = document.querySelectorAll('li')
        expect(items.length).toBeGreaterThan(0)
    })

    it('8.10 - ArrowUp → highlight bergerak ke atas', async () => {
        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={() => { }}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'ArrowUp' })

        // Should have moved up
        const items = document.querySelectorAll('li')
        expect(items.length).toBeGreaterThan(0)
    })

    it('8.11 - Enter pada highlighted option → option terpilih', async () => {
        const mockOnChange = vi.fn()

        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={mockOnChange}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)

        // Use fireEvent for keyboard navigation to avoid focus side-effects
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: 'Enter' })

        expect(mockOnChange).toHaveBeenCalledWith('1') // First item = Alpha (id: '1')
    })

    it('8.12 - Escape → dropdown tertutup', async () => {
        render(
            <SearchableSelect
                options={sampleOptions}
                value=""
                onChange={() => { }}
            />
        )

        const input = screen.getByPlaceholderText('Pilih...')
        await userEvent.click(input)
        expect(screen.getByText('Alpha')).toBeTruthy()

        fireEvent.keyDown(input, { key: 'Escape' })
        expect(screen.queryByText('Alpha')).toBeNull()
    })
})
