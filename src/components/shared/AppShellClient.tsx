'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JellyButton } from '@/components/shared/JellyButton';
import { SERVICE_CATEGORIES } from '@/core/validators/service';
import { createBrowserClient } from '@/lib/supabase';
import type { ProfileData } from '@/core/types/profile';

interface UserInfo {
  name: string;
  role: string;
  avatar: string | null;
}

export function AppShellHeader() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const res = await fetch('/api/profiles?scope=mine');
          if (res.ok) {
            const profile = await res.json() as ProfileData;
            setUser({ name: profile.name, role: profile.role, avatar: profile.avatar });
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/services?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, router]);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Desktop Header */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-xl font-bold bg-gradient-to-r from-peach-500 to-serenity-500 bg-clip-text text-transparent">
              봄결
            </span>
          </Link>

          {/* Category Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowCategories(!showCategories)}
              onBlur={() => setTimeout(() => setShowCategories(false), 200)}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              카테고리
              <svg className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCategories && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                <div className="grid grid-cols-3 gap-1">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.value}
                      href={`/services/${cat.value}`}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors text-center"
                      onClick={() => setShowCategories(false)}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="어떤 AI 영상이 필요하세요?"
                className="pl-10 pr-4 py-2 rounded-full bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Service Registration (Creator only, Desktop) */}
            {user?.role === 'creator' && (
              <Link href="/service/new" className="hidden md:block">
                <JellyButton gradient="mixed" size="sm" className="text-xs px-4">
                  서비스 등록
                </JellyButton>
              </Link>
            )}

            {/* Project Request */}
            <Link href="/project/new" className="hidden md:block">
              <Button variant="outline" size="sm" className="text-xs">
                프로젝트 의뢰
              </Button>
            </Link>

            {/* User Menu */}
            {!loading && (
              <>
                {user ? (
                  <div className="relative hidden md:block">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-peach-300 to-serenity-300 flex items-center justify-center text-white text-sm font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role === 'creator' ? '크리에이터' : '의뢰인'}</p>
                        </div>
                        <Link href={user.role === 'creator' ? '/dashboard/creator' : '/dashboard/client'} className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                          대시보드
                        </Link>
                        {user.role === 'creator' && (
                          <Link href="/dashboard/creator" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                            내 서비스
                          </Link>
                        )}
                        {user.role === 'client' && (
                          <Link href="/dashboard/client" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                            내 프로젝트
                          </Link>
                        )}
                        <Link href="/settings" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setShowUserMenu(false)}>
                          설정
                        </Link>
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50">
                          로그아웃
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <Link href="/auth">
                      <Button variant="ghost" size="sm" className="text-sm">로그인</Button>
                    </Link>
                    <Link href="/auth">
                      <JellyButton gradient="mixed" size="sm" className="text-xs px-4">회원가입</JellyButton>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search (Expandable) */}
        {showMobileSearch && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="어떤 AI 영상이 필요하세요?"
                  className="pl-10 rounded-full bg-gray-50"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}

        {/* Mobile Menu (Slide Down) */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-4">
            {/* Categories */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2">카테고리</p>
              <div className="grid grid-cols-3 gap-1">
                {SERVICE_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.value}
                    href={`/services/${cat.value}`}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 text-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[11px] text-gray-600">{cat.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-1 border-t border-gray-100 pt-3">
              <Link href="/project/new" className="block px-3 py-2 text-sm hover:bg-gray-50 rounded-lg" onClick={() => setShowMobileMenu(false)}>
                프로젝트 의뢰하기
              </Link>
              {user?.role === 'creator' && (
                <Link href="/service/new" className="block px-3 py-2 text-sm hover:bg-gray-50 rounded-lg" onClick={() => setShowMobileMenu(false)}>
                  서비스 등록하기
                </Link>
              )}
            </div>

            {/* Auth */}
            <div className="border-t border-gray-100 pt-3 px-3">
              {user ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <Link href={user.role === 'creator' ? '/dashboard/creator' : '/dashboard/client'} className="block py-2 text-sm hover:text-peach-500" onClick={() => setShowMobileMenu(false)}>
                    대시보드
                  </Link>
                  <button onClick={handleLogout} className="block py-2 text-sm text-red-500">로그아웃</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth" className="flex-1" onClick={() => setShowMobileMenu(false)}>
                    <Button variant="outline" className="w-full" size="sm">로그인</Button>
                  </Link>
                  <Link href="/auth" className="flex-1" onClick={() => setShowMobileMenu(false)}>
                    <JellyButton gradient="mixed" className="w-full" size="sm">회원가입</JellyButton>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
