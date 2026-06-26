import PageHeader from '@/components/PageHeader';
import { prisma } from '@/lib/prisma';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return (
    <div>
      <PageHeader title="User Management" subtitle="Add or remove staff accounts. All users have full access to the dashboard." />
      <UsersClient initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))} />
    </div>
  );
}
