-- ============================================
-- Fix: Accounting HO tetap melihat tiket setelah redirect ke IT Sabang
-- Date: 2026-02-17
-- ============================================
-- Problem: Ketika ACC_HO redirect tiket ke IT_SABANG, current_queue berubah
--          ke 'IT_SABANG', sehingga policy accounting_ho_can_read_queue
--          tidak lagi cocok dan tiket hilang dari view ACC_HO.
-- Fix:     Update policy agar ACC_HO bisa melihat tiket dengan
--          current_queue IN ('ACCOUNTING_HO', 'IT_SABANG').
-- ============================================

-- Step 1: Drop policy lama
DROP POLICY IF EXISTS "accounting_ho_can_read_queue" ON datafix_tickets;

-- Step 2: Buat policy baru - ACC_HO bisa melihat tiket di queue ACC_HO DAN IT_SABANG
CREATE POLICY "accounting_ho_can_read_queue"
ON datafix_tickets
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'ACCOUNTING_HO'
    )
    AND (
        current_queue = 'ACCOUNTING_HO'::ticket_queue
        OR current_queue = 'IT_SABANG'::ticket_queue
        OR reporter_user_id = auth.uid()
    )
);

-- Step 3: Verifikasi
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'datafix_tickets'
AND policyname = 'accounting_ho_can_read_queue';
