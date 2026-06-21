'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';

export function NotificationService() {
  const { user } = useAuth();
  useMatchNotifications(user?.uid);
  return null;
}
