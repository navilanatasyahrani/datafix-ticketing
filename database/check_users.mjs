import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://icsdsvzmbfrfpzygicfo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljc2RzdnptYmZyZnB6eWdpY2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTYzMDksImV4cCI6MjA4Mzc3MjMwOX0.TyG0aRWqZfZgImcvd24h82Xob3IIKmoerDhYhITFVI8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
    console.log('🔍 Mengecek daftar user yang terdaftar...\n');

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

    const adminCount = profiles.filter(p => p.role === 'admin').length;
    const requesterCount = profiles.filter(p => p.role === 'requester').length;

    console.log('📊 Statistik:');
    console.log(`   • Admin: ${adminCount} orang`);
    console.log(`   • Requester: ${requesterCount} orang`);
    console.log(`   • Total: ${profiles.length} orang\n`);
}

checkUsers();
