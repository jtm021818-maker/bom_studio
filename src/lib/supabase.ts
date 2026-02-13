import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';
import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ---------------------------------------------------------------------------
// 브라우저(클라이언트 컴포넌트) 용 Supabase 클라이언트
// ---------------------------------------------------------------------------
export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ---------------------------------------------------------------------------
// 서버(서버 컴포넌트 / API Route / Server Action) 용 Supabase 클라이언트
// 쿠키 기반 세션 관리
// ---------------------------------------------------------------------------
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출 시 쿠키 설정 불가 — 무시
            // 미들웨어에서 세션 갱신을 처리하므로 안전
          }
        },
      },
    }
  );
}

// ---------------------------------------------------------------------------
// 서비스 역할 클라이언트 (RLS 우회, 서버 전용)
// Storage 어댑터 등에서 사용
// ---------------------------------------------------------------------------
export function createServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      '[Supabase] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.'
    );
  }

  return _createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll() { return []; },
      setAll() { },
    },
  });
}
