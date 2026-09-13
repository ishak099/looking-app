export interface PointerLine {
  t: string;
  hold?: number;
}

export interface Pointer {
  id: string;
  lines: PointerLine[];
}

export type NotificationFrequency = 'off' | 'daily' | 'weekly';

export interface QuietHours {
  /** 0-23, local time. Notifications are suppressed from startHour up to endHour. */
  startHour: number;
  endHour: number;
}

export interface Settings {
  notificationFrequency: NotificationFrequency;
  quietHours: QuietHours;
}

/** A shuffled walk order over pointer ids, replayed front-to-back then reshuffled. */
export interface PointerQueueState {
  order: string[];
  cursor: number;
  lastId: string | null;
}
