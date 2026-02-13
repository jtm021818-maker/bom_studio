import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/project/new', '/admin'];
const AUTH_ROUTES = ['/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // 보호되지 않은 라우트는 바로 통과
  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  // Supabase 미들웨어 클라이언트 (쿠키 프록시)
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (getUser는 토큰 갱신을 트리거)
  const { data: { user } } = await supabase.auth.getUser();

  // 미인증 사용자 → 보호 라우트 접근 차단
  if (isProtected && !user) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 인증된 사용자 → 로그인 페이지 접근 시 대시보드로 리다이렉트
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard/client', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/project/new',
    '/admin/:path*',
    '/auth',
  ],
};
