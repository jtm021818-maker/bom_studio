/**
 * Better Auth → Supabase Auth 일괄 변환 스크립트
 * 
 * 모든 API 라우트 및 페이지에서:
 * 1. import { auth } from '@/lib/auth' → import { createServerSupabaseClient } from '@/lib/supabase'
 * 2. import { headers } from 'next/headers' → 제거 (cookies 불필요 - 이미 supabase.ts에서 처리)
 * 3. auth.api.getSession({ headers: await headers() }) → Supabase getUser()
 * 4. session.user.id → user.id
 * 5. session → user (조건부 체크)
 */

const fs = require('fs');
const path = require('path');

const files = [
    // API routes
    'src/app/api/projects/route.ts',
    'src/app/api/projects/[id]/route.ts',
    'src/app/api/projects/[id]/storyboard/route.ts',
    'src/app/api/projects/[id]/shotlist/route.ts',
    'src/app/api/projects/[id]/sow/route.ts',
    'src/app/api/proposals/route.ts',
    'src/app/api/contracts/route.ts',
    'src/app/api/milestones/route.ts',
    'src/app/api/deliveries/route.ts',
    'src/app/api/payments/route.ts',
    'src/app/api/messages/[projectId]/route.ts',
    'src/app/api/reviews/route.ts',
    'src/app/api/disputes/route.ts',
    'src/app/api/upload/route.ts',
    'src/app/api/upload/signed/route.ts',
    'src/app/api/profiles/route.ts',
    'src/app/api/creators/route.ts',
    // Pages
    'src/app/dashboard/client/page.tsx',
    'src/app/dashboard/creator/page.tsx',
    'src/app/project/[id]/page.tsx',
    'src/app/admin/page.tsx',
];

const root = process.cwd();
let changed = 0;
let errors = 0;

for (const file of files) {
    const fullPath = path.join(root, file);
    if (!fs.existsSync(fullPath)) {
        console.log(`⏭️  SKIP (not found): ${file}`);
        continue;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    const original = content;

    // 1. Replace import
    content = content.replace(
        /import\s*\{\s*auth\s*\}\s*from\s*['"]@\/lib\/auth['"];?\s*\n/g,
        "import { createServerSupabaseClient } from '@/lib/supabase';\n"
    );

    // 2. Remove `import { headers } from 'next/headers'` if no other usage of headers besides auth
    content = content.replace(
        /import\s*\{\s*headers\s*\}\s*from\s*['"]next\/headers['"];?\s*\n/g,
        ''
    );

    // 3. Replace session = await auth.api.getSession(...)
    // Pattern: const session = await auth.api.getSession({ headers: await headers() });
    content = content.replace(
        /const\s+session\s*=\s*await\s+auth\.api\.getSession\(\{\s*headers:\s*await\s+headers\(\)\s*\}\);/g,
        "const supabase = await createServerSupabaseClient();\n  const { data: { user } } = await supabase.auth.getUser();"
    );

    // 3b. Handle multi-line version in profiles/route.ts
    content = content.replace(
        /const\s+session\s*=\s*await\s+auth\.api\.getSession\(\{\s*\n\s*headers:\s*await\s+headers\(\)\s*,?\s*\n\s*\}\);/g,
        "const supabase = await createServerSupabaseClient();\n  const { data: { user } } = await supabase.auth.getUser();"
    );

    // 3c. Handle: auth.api.getSession({ headers: await headers() }).catch(() => null)
    content = content.replace(
        /auth\.api\.getSession\(\{\s*headers:\s*await\s+headers\(\)\s*\}\)\.catch\(\(\)\s*=>\s*null\)/g,
        "createServerSupabaseClient().then(s => s.auth.getUser()).then(r => r.data.user).catch(() => null)"
    );

    // 4. Replace session checks
    content = content.replace(/if\s*\(\s*!session\s*\)/g, 'if (!user)');
    content = content.replace(/if\s*\(\s*session\s*\)/g, 'if (user)');

    // 5. Replace session.user.id → user.id
    content = content.replace(/session\.user\.id/g, 'user.id');
    content = content.replace(/session\.user\.email/g, 'user.email');
    content = content.replace(/session\.user\.name/g, "user.user_metadata?.name ?? ''");

    // 6. Handle deduplicated createServerSupabaseClient calls in same function
    // If there are multiple `const supabase = await createServerSupabaseClient()` in the same file,
    // rename subsequent ones to reuse the same one
    // Actually, each function gets its own scope, so this should be fine

    if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        changed++;
        console.log(`✅ ${file}`);
    } else {
        console.log(`➖ ${file} (no changes)`);
    }
}

console.log(`\n=== 완료: ${changed}개 파일 변경, ${errors}개 에러 ===`);
