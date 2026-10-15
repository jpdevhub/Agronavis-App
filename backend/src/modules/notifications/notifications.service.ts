import axios from 'axios';
import type { AppNotification, Json, NotificationRow } from '@agronavis/shared-types';
import { logger } from '../../config/logger';
import { db } from '../../config/supabase';
import { fromPostgrest, notFound } from '../../shared/errors';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    data: row.data,
    read: row.read,
    createdAt: row.created_at,
  };
}

export const notificationsService = {
  async list(farmerId: string, limit = 30): Promise<AppNotification[]> {
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw fromPostgrest(error, 'List notifications');
    return (data ?? []).map((row) => toNotification(row as NotificationRow));
  },

  async unreadCount(farmerId: string): Promise<number> {
    const { count, error } = await db
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('farmer_id', farmerId)
      .eq('read', false);
    if (error) throw fromPostgrest(error, 'Count notifications');
    return count ?? 0;
  },

  async markRead(farmerId: string, id: string): Promise<AppNotification> {
    const { data, error } = await db
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('farmer_id', farmerId)
      .select('*')
      .maybeSingle();
    if (error) throw fromPostgrest(error, 'Update notification');
    if (!data) throw notFound('Notification not found');
    return toNotification(data as NotificationRow);
  },

  async markAllRead(farmerId: string): Promise<number> {
    const { data, error } = await db
      .from('notifications')
      .update({ read: true })
      .eq('farmer_id', farmerId)
      .eq('read', false)
      .select('id');
    if (error) throw fromPostgrest(error, 'Update notifications');
    return (data ?? []).length;
  },

  /**
   * Stores a notification and delivers it to the handset.
   *
   * Expo's push service is the one call that reaches both platforms: it hands
   * off to FCM on Android and APNs on iOS, so neither credential has to live
   * in this process. The row is written first and the push attempted second —
   * delivery is best effort, and a farmer who had their phone off must still
   * find the alert waiting when they open the app.
   */
  async send(
    farmerId: string,
    payload: { title: string; body: string; type?: string; data?: Record<string, unknown> },
  ): Promise<AppNotification | null> {
    const { data, error } = await db
      .from('notifications')
      .insert({
        farmer_id: farmerId,
        title: payload.title,
        body: payload.body,
        type: payload.type ?? 'general',
        data: (payload.data ?? {}) as Json,
      })
      .select('*')
      .maybeSingle();

    if (error) {
      logger.warn('Notification not stored', { farmerId, error: error.message });
      return null;
    }


    const { data: farmer } = await db
      .from('farmers')
      .select('expo_push_token')
      .eq('id', farmerId)
      .maybeSingle();

    if (farmer?.expo_push_token) {
      try {
        await axios.post(
          EXPO_PUSH_ENDPOINT,
          {
            to: farmer.expo_push_token,
            title: payload.title,
            body: payload.body,
            data: payload.data ?? {},
            sound: 'default',
            priority: 'high',
            // Android 8 and later drop a notification with no channel. The app
            // creates this one on first launch; naming it here is what gets
            // the alert through with sound and a heads-up banner.
            channelId: 'default',
          },
          { timeout: 8_000, headers: { 'Content-Type': 'application/json' } },
        );
      } catch (pushError) {
        logger.warn('Expo push delivery failed', {
          farmerId,
          error: (pushError as Error).message,
        });
      }
    }

    return toNotification(data as NotificationRow);
  },
};
