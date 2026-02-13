// Supabase 연결 테스트 스크립트
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local 직접 파싱
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('=== Supabase 연결 테스트 ===\n');
console.log(`URL: ${url ? '✅ ' + url : '❌ 미설정'}`);
console.log(`Anon Key: ${anonKey ? '✅ 길이 ' + anonKey.length : '❌ 미설정'}`);
console.log(`Service Key: ${serviceKey ? '✅ 길이 ' + serviceKey.length : '❌ 미설정'}`);

async function test() {
    // Anon 클라이언트
    console.log('\n--- Anon 클라이언트 ---');
    const anon = createClient(url, anonKey);
    const { error: e1 } = await anon.from('_test_nonexistent').select('*').limit(1);
    if (e1) {
        if (e1.message.includes('not exist') || e1.message.includes('relation') || e1.code === 'PGRST204' || e1.code === '42P01') {
            console.log('✅ 연결 성공! (테이블 미존재 에러 = 정상)');
        } else {
            console.log(`⚠️ 응답: ${e1.code} — ${e1.message}`);
        }
    } else {
        console.log('✅ 연결 성공!');
    }

    // Service Role 클라이언트
    console.log('\n--- Service Role 클라이언트 ---');
    const srv = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error: e2 } = await srv.from('_test_nonexistent').select('*').limit(1);
    if (e2) {
        if (e2.message.includes('not exist') || e2.message.includes('relation') || e2.code === 'PGRST204' || e2.code === '42P01') {
            console.log('✅ 연결 성공! (테이블 미존재 에러 = 정상)');
        } else {
            console.log(`⚠️ 응답: ${e2.code} — ${e2.message}`);
        }
    } else {
        console.log('✅ 연결 성공!');
    }

    console.log('\n🎉 Supabase 연결 테스트 완료!');
}

test().catch(err => {
    console.error(`\n❌ 연결 실패: ${err.message}`);
    process.exit(1);
});
