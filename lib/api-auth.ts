import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, restaurantId: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session, restaurantId: session.user.restaurantId, error: null };
}

export async function requireRestaurant() {
  const { session, restaurantId, error } = await requireAuth();
  if (error) return { session: null, restaurantId: null, error };
  if (!restaurantId) {
    return {
      session: null, restaurantId: null,
      error: NextResponse.json({ error: 'No restaurant linked to your account. Contact your administrator.' }, { status: 403 })
    };
  }
  return { session, restaurantId, error: null };
}
