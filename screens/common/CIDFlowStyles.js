import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS } from '../../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const CIDFlowStyles = StyleSheet.create({
  // ========== CONTAINERS ==========
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeAreaWhite: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  safeAreaDark: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  // ========== TYPOGRAPHY ==========
  headingLg: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 8,
  },
  headingMd: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  cryptoNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 24,
  },

  // ========== ICONS & CONTAINERS ==========
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 34,
  },

  // ========== SPINNER ==========
  spinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.slate200,
    borderTopColor: COLORS.primary,
    marginTop: 24,
  },

  // ========== CID CARD ==========
  cidCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cidCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.primary,
    marginBottom: 12,
  },
  cidFullText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 12,
    letterSpacing: 4,
  },
  cidSubNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // ========== SUCCESS CIRCLE ==========
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  checkMark: {
    fontSize: 38,
    color: COLORS.success,
  },

  // ========== PROFILE CARD ==========
  profileCard: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarIcon: {
    fontSize: 32,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileCID: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 3,
    marginTop: 4,
  },
  profileSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // ========== ACTION ROWS ==========
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 14,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  actionBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionArrow: {
    fontSize: 22,
    color: COLORS.textMuted,
  },

  // ========== QR CARD ==========
  qrCard: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginVertical: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  qrInner: {
    position: 'relative',
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLockBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  qrLockIcon: {
    fontSize: 20,
  },
  orShareText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 14,
  },
  orShareCID: {
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
  },

  // ========== SCANNER VIEWPORT ==========
  scannerViewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: SCREEN_W * 0.6,
    height: SCREEN_W * 0.6,
    position: 'relative',
  },
  scannerFrameGreen: {
    width: SCREEN_W * 0.6,
    height: SCREEN_W * 0.6,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 2,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.success,
    opacity: 0.8,
  },
  scanSuccessDot: {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerBottom: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  scannerHint: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  scannerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  scannerOr: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 16,
    marginBottom: 10,
  },
  enterCIDBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  enterCIDText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2,
  },

  // ========== BOTTOM SHEET ==========
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  e2eeHint: {
    backgroundColor: COLORS.successLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  e2eeHintText: {
    fontSize: 13,
    color: COLORS.success,
  },
  cancelText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },

  // ========== TAB ROW ==========
  tabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.slate100,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  // ========== SECONDARY BUTTON ==========
  secondaryActionBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ========== CID INPUT ==========
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  cidInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cidInputCell: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cidInputCellActive: {
    borderStyle: 'dashed',
    borderColor: COLORS.textMuted,
    backgroundColor: COLORS.background,
  },

  // ========== PASTE ROW ==========
  pasteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.slate100,
    borderRadius: 12,
    marginBottom: 12,
  },
  pasteIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  pasteText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // ========== BOXES ==========
  warningBox: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
    textAlign: 'center',
  },

  infoBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoBoxText: {
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 19,
    textAlign: 'center',
  },

  hintBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 19,
  },

  // ========== E2EE BADGE ==========
  e2eeBadge: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: COLORS.successLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  e2eeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
});
