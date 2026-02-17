# 📋 TODO: Database Update — Datafix Ticketing System

> **Tanggal**: 11 Februari 2026  
> **Status**: 🔲 Belum Dimulai

---

## 1. Kolom Baru di `datafix_tickets`

Database sudah ditambahkan 9 kolom baru berikut. Frontend harus diupdate agar mendukung kolom-kolom ini.

| Kolom | Tipe | Format | Nullable | Keterangan |
|-------|------|--------|----------|------------|
| `origin_region_id` | `uuid` | uuid | ✅ | FK ke `m_regions` — region asal tiket |
| `target_team` | `USER-DEFINED` | `ticket_target_team` | ✅ | Enum tim tujuan |
| `target_region_id` | `uuid` | uuid | ✅ | FK ke `m_regions` — region tujuan |
| `stage` | `USER-DEFINED` | `ticket_stage` | ✅ | Enum tahapan tiket |
| `triaged_by` | `uuid` | uuid | ✅ | User yang melakukan triage |
| `triaged_at` | `timestamptz` | timestamptz | ✅ | Waktu triage |
| `current_queue` | `USER-DEFINED` | `ticket_queue` | ❌ | Enum antrian saat ini |
| `redirected_by` | `uuid` | uuid | ✅ | User yang redirect tiket |
| `redirected_at` | `timestamptz` | timestamptz | ✅ | Waktu redirect |

### 1.1 Frontend — TypeScript Types (`src/types/index.ts`)
- [ ] Tambahkan 3 enum baru: `TicketTargetTeam`, `TicketStage`, `TicketQueue`
  - ⚠️ Cek dulu value yang valid di Supabase → enum definition
- [ ] Update interface `Ticket` — tambahkan 9 field baru:
  ```typescript
  origin_region_id?: string;
  target_team?: TicketTargetTeam;
  target_region_id?: string;
  stage?: TicketStage;
  triaged_by?: string;
  triaged_at?: string;
  current_queue: TicketQueue;
  redirected_by?: string;
  redirected_at?: string;
  // Relations
  origin_region?: Region;
  target_region?: Region;
  ```

### 1.2 Frontend — Service Layer (`src/services/ticketService.ts`)
- [ ] Update `getTickets()` query select — tambahkan 9 kolom baru + join `m_regions`
- [ ] Update `getTicketById()` query select — tambahkan 9 kolom baru + join `m_regions`
- [ ] Update `TicketFilters` interface — tambahkan filter untuk `stage`, `current_queue`, `target_team`, `origin_region_id`, `target_region_id`

### 1.3 Frontend — Form Buat Tiket (`src/pages/CreateTicket.tsx`)
- [ ] Tambahkan dropdown **Origin Region** (fetch dari `m_regions`)
- [ ] Tambahkan dropdown **Target Team** (dari enum `ticket_target_team`)
- [ ] Tambahkan dropdown **Target Region** (fetch dari `m_regions`)
- [ ] Update `formData` state — tambahkan field baru
- [ ] Update `handleSubmit` — kirim data field baru

### 1.4 Frontend — Ticket Detail (`src/pages/TicketDetail.tsx`)
- [ ] Tampilkan Origin Region, Target Team, Target Region
- [ ] Tampilkan Stage dan Current Queue
- [ ] Tampilkan info Triage (triaged_by, triaged_at)
- [ ] Tampilkan info Redirect (redirected_by, redirected_at)
- [ ] Admin: Tambahkan aksi untuk triage/redirect tiket

### 1.5 Frontend — Ticket List (`src/pages/TicketList.tsx`)
- [ ] Tambahkan kolom `Stage` atau `Queue` di tabel
- [ ] Tambahkan filter berdasarkan `stage`, `current_queue`, atau `region`

### 1.6 Dashboard (`src/pages/Dashboard.tsx`)
- [ ] Update RPC `get_ticket_stats` jika perlu statistik per stage/queue
- [ ] Tambahkan statistik per region (jika dibutuhkan)

---

## 2. Role-Role Baru

Role sekarang tidak hanya `admin` & `requester`, tapi juga:

| Role | Keterangan |
|------|------------|
| `admin` | Super Admin (sudah ada) |
| `requester` | Requester (sudah ada, mungkin berubah?) |
| `ACCOUNTING_HO` | Tim Accounting Head Office |
| `OUTLET` | Staff Outlet |
| `FIN_ADMIN` | Finance Admin |
| `IT_SABANG` | Tim IT Sabang |

### 2.1 Frontend — Types (`src/types/index.ts`)
- [ ] Update enum `UserRole` — tambahkan role baru:
  ```typescript
  export enum UserRole {
    REQUESTER = "requester",
    ADMIN = "admin",
    ACCOUNTING_HO = "ACCOUNTING_HO",
    OUTLET = "OUTLET",
    FIN_ADMIN = "FIN_ADMIN",
    IT_SABANG = "IT_SABANG",
  }
  ```

### 2.2 Frontend — Auth Context (`src/contexts/AuthContext.tsx`)
- [ ] Update logic `isAdmin` — sekarang hardcoded `role === 'admin'` (line 101)
- [ ] Pertimbangkan menambah helper: `isFinAdmin`, `isAccounting`, dll
- [ ] Atau buat logic `hasPermission(action)` yang lebih fleksibel
- [ ] Tentukan role mana yang boleh:
  - Buat tiket?
  - Triage tiket?
  - Redirect tiket?
  - Assign tiket?
  - Lihat semua tiket vs hanya tiket sendiri?

### 2.3 Frontend — User Management (`src/pages/UserManagement.tsx`)
- [ ] Update dropdown role di form **create** user (line 244-247) — tambahkan role baru
- [ ] Update dropdown role di form **edit** user (line 175-178) — tambahkan role baru
- [ ] Tampilkan label role yang human-readable di tabel users

### 2.4 Frontend — Layout & Sidebar
- [ ] Update `Sidebar.tsx` — tampilkan/sembunyikan menu berdasarkan role
- [ ] Update `Layout.tsx` — sesuaikan navigasi per role

### 2.5 Frontend — Ticket List & Detail
- [ ] Update `TicketList.tsx` — aksi yang terlihat disesuaikan per role (bukan hanya `isAdmin`)
- [ ] Update `TicketDetail.tsx` — tombol aksi sesuai role (triage, redirect, resolve, reject)

---

## 3. Perubahan RLS (Row Level Security)

### 3.1 Cek & Dokumentasi Policies Baru
- [ ] List semua RLS policies yang aktif untuk setiap tabel:
  - `datafix_tickets`
  - `ticket_detail_lines`
  - `ticket_attachments`
  - `ticket_status_history`
  - `profiles`
  - `m_branches`
  - `m_features`
  - `m_regions` (BARU)
- [ ] Dokumentasikan RLS policies baru ke file SQL

### 3.2 Validasi Akses per Role
- [ ] Test: `OUTLET` hanya bisa lihat tiket yang dia buat
- [ ] Test: `ACCOUNTING_HO` bisa lihat tiket dari region-nya
- [ ] Test: `FIN_ADMIN` bisa lihat tiket yang di-assign ke timnya
- [ ] Test: `IT_SABANG` akses sesuai privileges
- [ ] Test: `admin` bisa lihat semua tiket

### 3.3 Frontend — Error Handling
- [ ] Pastikan frontend handle `403` / `RLS violation` error dengan pesan yang jelas
- [ ] Jangan tampilkan UI/tombol yang user tidak punya akses

---

## 4. Tabel Baru `m_regions`

Tabel `m_regions` sudah dibuat di database:

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `uuid` | Primary Key |
| `region_name` | `text` | Nama region |
| `region_code` | `int4` | Kode region (angka) |

### 4.1 Relasi yang Sudah Ditambahkan
- ✅ `profiles.region_id` → FK ke `m_regions` (user punya region)
- ✅ `m_branches.region_id` → FK ke `m_regions` (branch dikelompokkan per region)
- ✅ `datafix_tickets.origin_region_id` → FK ke `m_regions`
- ✅ `datafix_tickets.target_region_id` → FK ke `m_regions`

### 4.2 Frontend — Types (`src/types/index.ts`)
- [ ] Tambahkan interface `Region`:
  ```typescript
  export interface Region {
    id: string;
    region_name: string;
    region_code: number;
  }
  ```
- [ ] Update interface `Branch` — tambah `region_id` dan `region?`:
  ```typescript
  export interface Branch {
    id: string;
    name: string;
    is_active: boolean;
    region_id?: string;
    created_at: string;
    region?: Region;
  }
  ```
- [ ] Update interface `Profile` — tambah `region_id` dan `region?`:
  ```typescript
  export interface Profile {
    id: string;
    full_name: string;
    display_name?: string;
    email?: string;
    role: UserRole;
    branch_id?: string;
    region_id?: string;
    created_at: string;
    branch?: Branch;
    region?: Region;
  }
  ```

### 4.3 Frontend — Service Layer (`src/services/masterDataService.ts`)
- [ ] Tambahkan fungsi `getRegions()`:
  ```typescript
  export const getRegions = async () => {
    const { data, error } = await supabase
      .from('m_regions')
      .select('*')
      .order('region_name');
    return { data: data as Region[] | null, error };
  };
  ```
- [ ] Update `getBranches()` — join `m_regions` kalau perlu tampilkan region di dropdown

### 4.4 Frontend — User Management (`src/pages/UserManagement.tsx`)
- [ ] Update query `getAllUsers()` di `userService.ts` — tambah join `region:m_regions(*)`
- [ ] Tambah dropdown Region di form create/edit user
- [ ] Tampilkan kolom Region di tabel user list

### 4.5 Frontend — Create Ticket (`src/pages/CreateTicket.tsx`)
- [ ] Load regions di `loadMasterData()`
- [ ] Tambah dropdown Origin Region dan Target Region di form

---

## 5. Testing & Verifikasi

### Per Fitur
- [ ] **Create Ticket**: buat tiket dengan field baru → cek data tersimpan di Supabase
- [ ] **Ticket List**: kolom baru muncul, filter bekerja
- [ ] **Ticket Detail**: semua field baru tampil, aksi triage/redirect bekerja
- [ ] **User Management**: create/edit user dengan role baru & region
- [ ] **Dashboard**: statistik tetap akurat

### Per Role
- [ ] Login sebagai `admin` → full akses
- [ ] Login sebagai `OUTLET` → akses terbatas sesuai RLS
- [ ] Login sebagai `ACCOUNTING_HO` → akses sesuai RLS
- [ ] Login sebagai `FIN_ADMIN` → akses sesuai RLS
- [ ] Login sebagai `IT_SABANG` → akses sesuai RLS

---

## 6. Daftar File yang Perlu Diubah

| # | File | Perubahan |
|---|------|-----------|
| 1 | `src/types/index.ts` | +3 enum baru, +interface Region, update Ticket/Branch/Profile, update UserRole |
| 2 | `src/services/ticketService.ts` | Update query select (9 kolom + join region), update filter |
| 3 | `src/services/masterDataService.ts` | Tambah `getRegions()`, update `getBranches()` join region |
| 4 | `src/services/userService.ts` | Update `getAllUsers()` join region, support role baru |
| 5 | `src/contexts/AuthContext.tsx` | Update role checks, tambah helper permission functions |
| 6 | `src/pages/CreateTicket.tsx` | Tambah dropdown region, target_team; update formData & submit |
| 7 | `src/pages/TicketDetail.tsx` | Tampilkan field baru, tambah aksi triage/redirect |
| 8 | `src/pages/TicketList.tsx` | Kolom & filter baru (stage, queue, region) |
| 9 | `src/pages/UserManagement.tsx` | Dropdown role baru, dropdown region, tampilkan di tabel |
| 10 | `src/pages/Dashboard.tsx` | Update statistik jika perlu |
| 11 | `src/components/Sidebar.tsx` | Menu visibility per role |
| 12 | `src/components/Layout.tsx` | Navigasi per role |
| 13 | `src/constants/assignees.ts` | Review apakah masih relevan atau diganti dengan role-based |
