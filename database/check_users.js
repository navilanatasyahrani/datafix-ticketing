// Script untuk melihat daftar user yang terdaftar di sistem
// Jalankan dengan: node database/check_users.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
    console.log('🔍 Mengecek daftar user yang terdaftar...\n');

    try {
        // Query profiles table dengan join ke branches
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
        id,
        full_name,
        role,
        created_at,
        branch:m_branches(name)
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        if (!profiles || profiles.length === 0) {
            console.log('⚠️  Tidak ada user yang terdaftar.');
            return;
        }

        console.log(`✅ Ditemukan ${profiles.length} user:\n`);
        console.log('┌────────────────────────────────────────────────────────────────┐');
        console.log('│ No │ Nama Lengkap          │ Role       │ Cabang           │');
        console.log('├────────────────────────────────────────────────────────────────┤');

        profiles.forEach((profile, index) => {
            const no = String(index + 1).padEnd(2);
            const name = String(profile.full_name || '-').padEnd(21);
            const role = String(profile.role || '-').padEnd(10);
            const branch = String(profile.branch?.name || 'Belum Set').padEnd(16);

            console.log(`│ ${no} │ ${name} │ ${role} │ ${branch} │`);
        });

        console.log('└────────────────────────────────────────────────────────────────┘\n');

        // Statistik role
        const adminCount = profiles.filter(p => p.role === 'admin').length;
        const requesterCount = profiles.filter(p => p.role === 'requester').length;

        console.log('📊 Statistik:');
        console.log(`   • Admin: ${adminCount} orang`);
        console.log(`   • Requester: ${requesterCount} orang`);
        console.log(`   • Total: ${profiles.length} orang\n`);

    } catch (err) {
        console.error('❌ Terjadi kesalahan:', err.message);
    }
}

checkUsers();
