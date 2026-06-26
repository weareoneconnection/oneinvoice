import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PageHeader from '@/components/PageHeader';
import RestaurantSettingsClient from './RestaurantSettingsClient';

export default async function RestaurantSettingsPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session?.user.restaurantId;

  const restaurant = restaurantId
    ? await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    : null;

  return (
    <div>
      <PageHeader
        title="Restaurant Setup"
        subtitle="Configure your restaurant profile and MyInvois API credentials. Each restaurant uses their own LHDN MyInvois account."
      />
      <RestaurantSettingsClient restaurant={restaurant} />
    </div>
  );
}
