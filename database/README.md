# Panduan Setup Database Datafix Ticketing

## Cara Menjalankan Migration Script

### 1. Via Supabase Dashboard (Recommended)

1. **Login ke Supabase Dashboard**
   - Buka https://supabase.com
   - Login dan pilih project Anda

2. **Buka SQL Editor**
   - Di sidebar kiri, klik **SQL Editor**
   - Klik **New query**

3. **Copy-Paste SQL Script**
   - Buka file `001_initial_schema.sql`
   - Copy seluruh isinya
   - Paste ke SQL Editor

4. **Run Script**
   - Klik tombol **Run** (atau tekan Ctrl+Enter)
   - Tunggu sampai selesai (biasanya 10-30 detik)
   - Lihat hasil di bagian bawah, pastikan tidak ada error

5. **Verify Tables Created**
   - Klik **Table Editor** di sidebar
   - Anda akan melihat semua tabel yang baru dibuat

### 2. Setup Storage Bucket

Setelah menjalankan SQL script, setup storage bucket:

1. **Buka Storage**
   - Di sidebar, klik **Storage**

2. **Create New Bucket**
   - Klik **New bucket**
   - Name: `ticket-attachments`
   - Public bucket: **Yes** (centang)
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/webp`
   - Klik **Create bucket**

3. **Set Storage Policies**
   - Pilih bucket `ticket-attachments`
   - Klik **Policies**
   - Add policy untuk upload:
     ```sql
     CREATE POLICY "Authenticated users can upload"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'ticket-attachments');
     ```
   - Add policy untuk read:
     ```sql
     CREATE POLICY "Public can view files"
     ON storage.objects FOR SELECT
     TO public
     USING (bucket_id = 'ticket-attachments');
     ```

### 3. Create Admin User

Untuk membuat user admin pertama kali:

1. **Via Supabase Dashboard**
   - Buka **Authentication** → **Users**
   - Klik **Add user** → **Create new user**
   - Email: `admin@example.com`
   - Password: buat password yang kuat
   - User Metadata → Add key `role` with value `admin`
   - Klik **Create user**

2. **Via SQL (Alternative)**
   ```sql
   -- Setelah user signup via aplikasi, update rolenya jadi admin:
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = 'USER_ID_HERE';
   ```

### 4. Verify Setup

Checklist untuk memastikan setup berhasil:

- [ ] Semua tabel sudah dibuat (10 tabel)
- [ ] Sample data branches sudah ada (6 cabang)
- [ ] Sample data features sudah ada (10+ fitur)
- [ ] Storage bucket `ticket-attachments` sudah dibuat
- [ ] RLS policies sudah aktif di semua tabel
- [ ] Function `get_ticket_stats()` sudah dibuat
- [ ] Trigger `handle_new_user()` sudah aktif
- [ ] User admin sudah dibuat

### 5. Test dari Aplikasi

Jalankan aplikasi dan test:

```bash
cd d:\ProjectCoding\datafix-ticketing
npm run dev
```

Buka browser dan test:
1. Login dengan user admin
2. Create ticket baru
3. Upload screenshot
4. View ticket list
5. Check apakah data tersimpan dengan benar

## Troubleshooting

### Error: "relation already exists"
- Tabel sudah ada sebelumnya
- Solusi: Hapus tabel yang konflik atau skip bagian CREATE TABLE

### Error: "permission denied"
- RLS policy terlalu ketat
- Solusi: Check policy di Supabase Dashboard → Table Editor → Policy

### Upload file gagal
- Storage bucket belum dibuat atau policy salah
- Solusi: Ikuti langkah Setup Storage Bucket di atas

### get_ticket_stats() tidak bekerja
- Function belum dibuat atau ada syntax error
- Solusi: Re-run bagian CREATE FUNCTION di SQL Editor

## Additional SQL Queries

### Check jumlah data di setiap tabel:
```sql
SELECT 
  'branches' as table_name, COUNT(*) as count FROM m_branches
UNION ALL
SELECT 'features', COUNT(*) FROM m_features
UNION ALL
SELECT 'tickets', COUNT(*) FROM datafix_tickets
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;
```

### View semua tickets dengan detail:
```sql
SELECT 
  t.id,
  t.status,
  t.priority,
  p.full_name as reporter,
  b.name as branch,
  f.name as feature,
  t.created_at
FROM datafix_tickets t
LEFT JOIN profiles p ON t.reporter_user_id = p.id
LEFT JOIN m_branches b ON t.branch_id = b.id
LEFT JOIN m_features f ON t.feature_id = f.id
ORDER BY t.created_at DESC;
```

### Change user role:
```sql
-- Make user admin
UPDATE profiles SET role = 'admin' WHERE id = 'USER_ID';

-- Make user requester
UPDATE profiles SET role = 'requester' WHERE id = 'USER_ID';
```
