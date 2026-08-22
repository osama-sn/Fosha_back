/**
 * Domain Enums and Centralized Constants
 * Centralizes all status strings, roles, and types to ensure Clean Code & SOLID compliance.
 */

const UserRole = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COMPANY_ADMIN: 'company_admin',
  USER: 'user',
});

const BookingStatus = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
});

const PaymentStatus = Object.freeze({
  UNPAID: 'unpaid',
  PENDING_VERIFICATION: 'pending_verification',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  REFUNDED: 'refunded',
  PAY_ON_ARRIVAL: 'pay_on_arrival',
});

const PaymentMethod = Object.freeze({
  VODAFONE_CASH: 'vodafone_cash',
  ORANGE_CASH: 'orange_cash',
  ETISALAT_CASH: 'etisalat_cash',
  INSTAPAY: 'instapay',
  WALLET: 'wallet',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
});

const TripStatus = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
});

const CompanyStatus = Object.freeze({
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
});

const SubscriptionStatus = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  GRACE_PERIOD: 'grace_period',
});

const CommissionType = Object.freeze({
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
});

const ChatType = Object.freeze({
  PRE_BOOKING: 'pre_booking',
  BOOKING_RELATED: 'booking_related',
});

module.exports = {
  UserRole,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  TripStatus,
  CompanyStatus,
  SubscriptionStatus,
  CommissionType,
  ChatType,
};
