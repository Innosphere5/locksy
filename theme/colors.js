// Locksy Color Palette & Theme
export const COLORS = {
  // Primary
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryDark: '#1D4ED8',

  // Neutrals
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  dark: '#0F172A',
  text: '#0F172A',
  textMuted: '#64748B',
  placeholder: '#9CA3AF',

  // Slate (secondary)
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',

  // Success
  success: '#10B981',
  successLight: '#D1FAE5',

  // Error/Danger
  error: '#DC2626',
  danger: '#DC2626',
  errorLight: '#FEE2E2',
  errorAccent: '#FEF2F2',
  red500: '#EF4444',

  // Warning
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Status Colors
  online: '#22C55E',
  offline: '#9CA3AF',
  pending: '#F59E0B',

  // Background
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  inputBg: '#F1F5F9',
  border: '#E2E8F0',

  // Message Bubbles
  sentBg: '#2563EB',
  sentText: '#FFFFFF',
  receivedBg: '#F1F5F9',
  receivedText: '#0F172A',
  bubbleReceived: '#F1F5F9',

  // Encryption colors
  encryptionBg: '#DBEAFE',
  encryptionBorder: '#93C5FD',
  encryptionText: '#1E40AF',

  // Gradient backgrounds for avatars
  avatarBg: '#EEF2FF',
  avatar: {
    blue: '#EEF2FF',
    purple: '#EDE9FE',
    pink: '#FCE7F3',
    green: '#DCFCE7',
    red: '#FEE2E2',
    cyan: '#DBEAFE',
  },

  // Badge colors
  badge: {
    e2ee: '#2563EB',
    group: '#64748B',
    verified: '#10B981',
  },
  badgeClosed: '#FEE2E2',
  badgeClosedText: '#DC2626',
  badgeApproval: '#FEF3C7',
  badgeApprovalText: '#B45309',

  // Tab colors
  tabInactive: '#9CA3AF',

  // Locked chat colors
  lockedBg: '#FCE7F3',
  lockedText: '#BE185D',

  // Timer/Expiry colors
  timerBg: '#FEF3C7',
  timerText: '#B45309',
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  h3: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  h4: { fontSize: 20, fontWeight: '700' },
  h5: { fontSize: 18, fontWeight: '600' },
  body1: { fontSize: 16, fontWeight: '500' },
  body2: { fontSize: 15, fontWeight: '400' },
  body3: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '500' },
  tiny: { fontSize: 11, fontWeight: '600' },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Font family exports (aliases for screens)
export const FONTS = {
  bold: 'System',
  semiBold: 'System',
  regular: 'System',
};

// Sizes exports (aliases for screens)
export const SIZES = {
  padding: 16,
  paddingSmall: 8,
  paddingMedium: 12,
  paddingLarge: 20,
};
