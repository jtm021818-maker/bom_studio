import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AppShell } from '@/components/shared/AppShell';
import { profileRepository } from '@/adapters/db/repositories/profile';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const profile = await profileRepository.findByUserId(user.id);
  if (!profile) redirect('/auth');

  const isCreator = profile.role === 'creator';

  const navItems = isCreator
    ? [
        { href: '/dashboard/creator', label: '대시보드' },
        { href: '/dashboard/creator', label: '내 서비스', hash: '#services' },
        { href: `/creator/${profile.id}`, label: '포트폴리오' },
        { href: '/explore/projects', label: '프로젝트 탐색' },
        { href: '/settings', label: '설정' },
      ]
    : [
        { href: '/dashboard/client', label: '대시보드' },
        { href: '/dashboard/client', label: '내 주문', hash: '#orders' },
        { href: '/dashboard/client', label: '내 프로젝트', hash: '#projects' },
        { href: '/services', label: '서비스 탐색' },
        { href: '/settings', label: '설정' },
      ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar — hidden on mobile */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-peach-300 to-serenity-300 flex items-center justify-center text-white font-medium">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">{isCreator ? '크리에이터' : '의뢰인'}</p>
                </div>
              </div>

              {/* Nav Links */}
              <nav className="space-y-1">
                {navItems.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
