import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import { eq, desc, isNull, and, ne } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { projects } from '@/adapters/db/schema/projects';
import { disputes } from '@/adapters/db/schema/feedback';
import { AppShell } from '@/components/shared/AppShell';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyRange } from '@/components/shared/MoneyDisplay';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProjectStatus } from '@/core/types/project';
import type { DisputeStatus } from '@/core/types/review';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').filter(Boolean);

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? '');
  if (!isAdmin) redirect('/dashboard/client');

  // Fetch all open projects
  const openProjects = await db.select().from(projects)
    .where(and(eq(projects.status, 'open'), isNull(projects.deletedAt)))
    .orderBy(desc(projects.createdAt))
    .limit(50);

  // Fetch all non-closed disputes
  const openDisputes = await db.select().from(disputes)
    .where(and(ne(disputes.status, 'closed'), isNull(disputes.deletedAt)))
    .orderBy(desc(disputes.createdAt))
    .limit(50);

  // Stats
  const allProjectsResult = await db.select().from(projects)
    .where(isNull(projects.deletedAt));
  const totalProjects = allProjectsResult.length;
  const openDisputeCount = openDisputes.length;

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard>
            <GlassCardContent className="py-4">
              <p className="text-sm text-muted-foreground">전체 프로젝트</p>
              <p className="text-3xl font-bold mt-1">{totalProjects}</p>
            </GlassCardContent>
          </GlassCard>
          <GlassCard>
            <GlassCardContent className="py-4">
              <p className="text-sm text-muted-foreground">모집 중 프로젝트</p>
              <p className="text-3xl font-bold mt-1">{openProjects.length}</p>
            </GlassCardContent>
          </GlassCard>
          <GlassCard>
            <GlassCardContent className="py-4">
              <p className="text-sm text-muted-foreground">진행 중 분쟁</p>
              <p className="text-3xl font-bold mt-1 text-destructive">{openDisputeCount}</p>
            </GlassCardContent>
          </GlassCard>
          <GlassCard>
            <GlassCardContent className="py-4">
              <p className="text-sm text-muted-foreground">에스크로 관리</p>
              <p className="text-xs text-muted-foreground mt-2">
                PATCH /api/payments
              </p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Open Projects Table */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-lg">모집 중 프로젝트</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {openProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                모집 중인 프로젝트가 없습니다.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>예산</TableHead>
                    <TableHead>마감일</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <a
                          href={`/project/${project.id}`}
                          className="text-primary hover:underline"
                        >
                          {project.title}
                        </a>
                      </TableCell>
                      <TableCell className="text-sm">{project.category}</TableCell>
                      <TableCell>
                        <MoneyRange min={project.budgetMin} max={project.budgetMax} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {project.deadline.toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={project.status as ProjectStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Disputes Table */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-lg">진행 중 분쟁</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {openDisputes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                진행 중인 분쟁이 없습니다.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>분쟁 ID</TableHead>
                    <TableHead>사유</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead>관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openDisputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-mono text-xs">
                        {dispute.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {dispute.reason}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={dispute.status as DisputeStatus} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {dispute.createdAt.toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="space-x-2">
                          {dispute.status === 'open' && (
                            <span>PATCH /api/disputes?id={dispute.id.slice(0, 8)}&amp;action=investigate</span>
                          )}
                          {dispute.status === 'investigating' && (
                            <span>PATCH /api/disputes?id={dispute.id.slice(0, 8)}&amp;action=resolve</span>
                          )}
                          {dispute.status === 'resolved' && (
                            <span>PATCH /api/disputes?id={dispute.id.slice(0, 8)}&amp;action=close</span>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </AppShell>
  );
}
