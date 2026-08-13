// Centralized J&T Supplies CRM Business Configuration
import { DayOfWeek } from '../types';

export const BUSINESS_TIMEZONE = 'America/Vancouver';
export const DEFAULT_CURRENCY = 'CAD';
export const DEFAULT_LOCALE = 'en-CA';

/**
 * Standard Weekly Route Delivery Schedule configuration.
 * Maps Delivery Days (Day of Week) to active routes/cities.
 */
export const ROUTE_DELIVERY_SCHEDULE: Record<DayOfWeek, string[]> = {
  monday: ['Kelowna'],
  tuesday: ['Kelowna', 'West Kelowna', 'Summerland'],
  wednesday: ['Kelowna', 'Penticton', 'West Kelowna', 'Osoyoos', 'Oliver'],
  thursday: ['Kelowna', 'Penticton', 'Princeton', 'Keremeos', 'Osoyoos', 'Oliver', 'Merritt'],
  friday: ['Vernon', 'Salmon Arm', 'Lake Country', 'Armstrong'],
  saturday: ['Vernon', 'Kamloops', 'Falkland', 'Chase', 'Salmon Arm', 'Lake Country'],
  sunday: ['Kelowna', 'Penticton', 'Osoyoos', 'Oliver', 'West Kelowna'],
};

/**
 * Mapping of Delivery Days to their corresponding Previous-Day Processing Days.
 * Rule: Order Processing Day = Calendar Day before Delivery Day.
 */
export const DELIVERY_TO_PROCESSING_DAY_MAP: Record<DayOfWeek, DayOfWeek> = {
  monday: 'sunday',
  tuesday: 'monday',
  wednesday: 'tuesday',
  thursday: 'wednesday',
  friday: 'thursday',
  saturday: 'friday',
  sunday: 'saturday',
};

/**
 * Mapping of Processing Days to their corresponding Next-Day Delivery Days.
 */
export const PROCESSING_TO_DELIVERY_DAY_MAP: Record<DayOfWeek, DayOfWeek> = {
  sunday: 'monday',
  monday: 'tuesday',
  tuesday: 'wednesday',
  wednesday: 'thursday',
  thursday: 'friday',
  friday: 'saturday',
  saturday: 'sunday',
};
