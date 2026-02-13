'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from '@/components/shared/GlassCard';

type AuthMode = 'login' | 'signup';
type Role = 'client' | 'creator';

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createBrowserClient();

  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard/client';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role },
          },
        });
        if (error) {
          setError(error.message);
        } else {
          setError('');
          // Supabase 기본 설정에서는 이메일 확인 필요
          // 개발 중에는 대시보드에서 "Confirm email" 끄면 바로 로그인 가능
          alert('회원가입 완료! 이메일을 확인해주세요. (개발 모드에서는 바로 로그인 가능)');
          setMode('login');
        }
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });
      if (error) {
        setError('Google 로그인에 실패했습니다: ' + error.message);
        setLoading(false);
      }
    } catch {
      setError('Google 로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <GlassCardHeader className="text-center">
        <GlassCardTitle className="text-2xl bg-gradient-to-r from-peach-500 to-serenity-500 bg-clip-text text-transparent">
          봄결 스튜디오
        </GlassCardTitle>
        <GlassCardDescription>
          {mode === 'login' ? '계정에 로그인하세요' : '새 계정을 만들어보세요'}
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Google OAuth */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 계속하기
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/70 px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@bomgyeol.studio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              required
              minLength={6}
            />
          </div>

          {/* Role Selection (signup only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label>역할 선택</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`p-3 rounded-lg border text-center text-sm transition-all ${role === 'client'
                      ? 'border-peach-400 bg-peach-50 text-peach-600 font-medium'
                      : 'border-border hover:border-peach-200'
                    }`}
                >
                  <div className="text-lg mb-1">📋</div>
                  의뢰인
                </button>
                <button
                  type="button"
                  onClick={() => setRole('creator')}
                  className={`p-3 rounded-lg border text-center text-sm transition-all ${role === 'creator'
                      ? 'border-serenity-400 bg-serenity-50 text-serenity-600 font-medium'
                      : 'border-border hover:border-serenity-200'
                    }`}
                >
                  <div className="text-lg mb-1">🎬</div>
                  크리에이터
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              계정이 없으신가요?{' '}
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                className="text-primary underline-offset-4 hover:underline"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className="text-primary underline-offset-4 hover:underline"
              >
                로그인
              </button>
            </>
          )}
        </p>
      </GlassCardContent>
    </GlassCard>
  );
}
