/**
 * Shared types + pure logic for the in-app notification bell. Kept
 * dependency-free so the unread calculation is unit-testable and reusable on
 * client and server.
 */

export interface NotificationItem {
  id: string;
  referenceNumber: string;
  /** Human line, e.g. the customer name or a task label. */
  title: string;
  /** ISO timestamp the underlying item was created. */
  createdAt: string;
  /** Where clicking the notification navigates. */
  href: string;
  status: string;
}

/**
 * How many items are newer than the viewer last looked. With no prior "seen"
 * timestamp, everything counts as unread.
 */
export function countUnread(items: Pick<NotificationItem, "createdAt">[], lastSeen: string | null): number {
  if (!lastSeen) return items.length;
  const seen = Date.parse(lastSeen);
  if (Number.isNaN(seen)) return items.length;
  return items.filter((i) => Date.parse(i.createdAt) > seen).length;
}
