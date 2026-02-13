import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AppShellHeader } from './AppShellClient';
import { SERVICE_CATEGORIES } from '@/core/validators/service';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/30">
      <AppShellHeader />
      <main className={cn('flex-1', className)}>
        {children}
      </main>
      <AppShellFooter />
    </div>
  );
}

function AppShellFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-3">
            <span className="text-lg font-bold bg-gradient-to-r from-peach-500 to-serenity-500 bg-clip-text text-transparent">
              봄결 스튜디오
            </span>
            <p className="text-sm text-muted-foreground">
              AI 영상 제작 전문 마켓플레이스.<br />
              크리에이터와 의뢰인을 연결합니다.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">카테고리</h4>
            <div className="grid grid-cols-2 gap-1">
              {SERVICE_CATEGORIES.slice(0, 6).map((cat) => (
                <Link
                  key={cat.value}
                  href={`/services/${cat.value}`}
                  className="text-sm text-muted-foreground hover:text-gray-900 transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
              <Link href="/services" className="text-sm text-peach-500 hover:text-peach-600 transition-colors">
                전체보기 →
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">이용 안내</h4>
            <div className="space-y-1">
              <Link href="/terms" className="block text-sm text-muted-foreground hover:text-gray-900 transition-colors">이용약관</Link>
              <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-gray-900 transition-colors">개인정보처리방침</Link>
              <Link href="/help" className="block text-sm text-muted-foreground hover:text-gray-900 transition-colors">고객센터</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-muted-foreground">
          &copy; 2026 봄결 스튜디오. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
