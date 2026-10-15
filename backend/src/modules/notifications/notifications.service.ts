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
    severity: row.severity ?? 'medium',
    data: row.data,
    read: row.read,
    createdAt: row.created_at,
  };
}

/**
 * Severities that are allowed to light up a handset.
 *
 * Everything is stored and everything shows in the app. This decides only what
 * interrupts someone — an app that buzzes for all of it gets its notifications
 * switched off, and the alert that mattered is lost along with the rest.
 */
const PUSH_SEVERITIES: ReadonlySet<string> = new Set(['critical', 'high']);

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
   * Stores a notification, then delivers it if its severity warrants one.
   *
   * Storing and delivering are separate decisions. Every alert is written to
   * Supabase so it is there to read in the app whatever happens next; only the
   * urgent ones are pushed. Before this they were the same decision, so a
   * medium advisory was never written at all and could not be read anywhere.
   *
   * Expo's push service is the single call that reaches both platforms — it
   * hands off to FCM on Android and APNs on iOS — so neither credential has to
   * live in this process. Delivery is best effort and its outcome is recorded
   * on the row rather than only logged: a push that silently failed is
   * indistinguishable from one that was never sent unless something writes it
   * down.
   */
  async send(
    farmerId: string,
    payload: {
      title: string;
      body: string;
      type?: string;
      severity?: AppNotification['severity'];
      data?: Record<string, unknown>;
    },
  ): Promise<AppNotification | null> {
    const severity = payload.severity ?? 'medium';

    const { data, error } = await db
      .from('notifications')
      .insert({
        farmer_id: farmerId,
        title: payload.title,
        body: payload.body,
        type: payload.type ?? 'general',
        severity,
        data: (payload.data ?? {}) as Json,
      })
      .select('*')
      .maybeSingle();

    if (error) {
      logger.warn('Notification not stored', { farmerId, error: error.message });
      return null;
    }

    const row = data as NotificationRow & { id: string };

    const settle = async (
      delivery: 'sent' | 'failed' | 'skipped',
      deliveryError?: string,
    ): Promise<void> => {
      await db
        .from('notifications')
        .update({
          delivery,
          delivered_at: delivery === 'sent' ? new Date().toISOString() : null,
          delivery_error: deliveryError ?? null,
        })
        .eq('id', row.id);
    };

    if (!PUSH_SEVERITIES.has(severity)) {
      await settle('skipped');
      return toNotification(row);
    }

    const { data: farmer } = await db
      .from('farmers')
      .select('expo_push_token')
      .eq('id', farmerId)
      .maybeSingle();

    if (!farmer?.expo_push_token) {
      await settle('skipped', 'No device registered');
      return toNotification(row);
    }

    try {
      await axios.post(
        EXPO_PUSH_ENDPOINT,
        {
          to: farmer.expo_push_token,
          title: payload.title,
          body: payload.body,
          data: { ...(payload.data ?? {}), notificationId: row.id },
          sound: 'default',
          priority: 'high',
          // Android 8 and later drop a notification with no channel. The app
          // creates this one on first launch; naming it here is what gets the
          // alert through with sound and a heads-up banner.
          channelId: 'default',
        },
        { timeout: 8_000, headers: { 'Content-Type': 'application/json' } },
      );
      await settle('sent');
    } catch (pushError) {
      const message = (pushError as Error).message;
      logger.warn('Expo push delivery failed', { farmerId, error: message });
      await settle('failed', message.slice(0, 500));
    }

    return toNotification(row);
  },
};
