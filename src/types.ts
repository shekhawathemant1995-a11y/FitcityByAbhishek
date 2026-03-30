import { useState, useEffect } from 'react';

export type MembershipType = 'Monthly' | 'Quarterly' | 'Half Yearly' | 'PT' | 'GPT';

export interface Member {
  id: string;
  uid?: string;
  name: string;
  phone: string;
  email: string;
  joinDate: string;
  expiryDate: string;
  plan: MembershipType;
  status: 'Active' | 'Expired' | 'Pending';
  amountPaid: number;
  photoURL?: string;
  attendance?: Record<string, boolean>;
}

export interface ProgressRecord {
  id?: string;
  uid: string;
  date: string;
  weight: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
  };
}

export interface PaymentRecord {
  id?: string;
  uid: string;
  date: string;
  amount: number;
  plan: string;
  status: 'Success' | 'Pending' | 'Failed';
  method?: string;
}

export interface NotificationRecord {
  id?: string;
  uid: string;
  title: string;
  message: string;
  type: 'Renewal' | 'Workout' | 'Offer' | 'System';
  date: string;
  read: boolean;
}

export interface WorkoutPlan {
  id?: string;
  day: string;
  title: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
  }[];
}

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  date: string;
  authorId: string;
}

export const INITIAL_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    joinDate: '2024-01-15',
    expiryDate: '2024-04-15',
    plan: 'Quarterly',
    status: 'Active',
    amountPaid: 7000,
  },
  {
    id: '2',
    name: 'Priya Singh',
    phone: '9988776655',
    email: 'priya@example.com',
    joinDate: '2024-02-01',
    expiryDate: '2024-03-01',
    plan: 'Monthly',
    status: 'Active',
    amountPaid: 3500,
  }
];

export const PLANS = [
  { name: 'Monthly', price: 3500, duration: '1 Month', type: 'Membership' },
  { name: 'Quarterly', price: 7000, duration: '3 Months', type: 'Membership' },
  { name: 'Half Yearly', price: 10000, duration: '6 Months', type: 'Membership' },
  { name: 'PT (Coach Mohit)', price: 12000, duration: '1 Month', type: 'Personal Training' },
  { name: 'PT (Coach Abhishek)', price: 13000, duration: '3 Days/Week', type: 'Personal Training' },
  { name: 'GPT (3 Days)', price: 13000, duration: '3 Months', type: 'Group Training' },
  { name: 'GPT (6 Days)', price: 24000, duration: '3 Months', type: 'Group Training' },
];

export const SCHEDULE = [
  { day: 'MON', morning: 'UBS TRAINING', evening: 'UBS TRAINING', timeM: '7 AM - 8 AM', timeE: '6 PM - 7 PM' },
  { day: 'TUE', morning: 'FUNCTIONAL TRAINING', evening: 'FUNCTIONAL TRAINING', timeM: '7 AM - 8 AM', timeE: '6 PM - 7 PM' },
  { day: 'WED', morning: 'ZUMBA/CARDIO', evening: 'LEGS WORKOUT', timeM: '7 AM - 8 AM', timeE: '6 PM - 7 PM' },
  { day: 'THU', morning: 'FLEXIBILITY', evening: 'CORE & CARDIO', timeM: '7 AM - 8 AM', timeE: '6 PM - 7 PM' },
  { day: 'FRI', morning: 'LEGS WORKOUT', evening: 'COMPOUND STRENGTH', timeM: '7 AM - 8 AM', timeE: '6 PM - 7 PM' },
  { day: 'SAT', morning: 'CORE & CARDIO', evening: 'FLEXIBILITY/MOBILITY', timeM: '7 AM - 8 AM', timeE: '6 PM - 7 PM' },
];
