/**
 * AddContactByCIDScreen.jsx - Locksy Secure Chat
 * ─────────────────────────────────────────────────────────────────
 * Add new contact by entering their Contact ID (CID)
 * Shows user's own CID and provides input for other user's CID
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "../../theme";
import { CIDContext } from "../../context/CIDContext";
import socketService from "../../utils/socketService";
import useSocketNavigation from "../../hooks/useSocketNavigation";

const { height: screenHeight } = Dimensions.get("screen");

/**
 * AddContactByCIDScreen
 * User can view their CID and enter another user's CID to create a connection
 */
export default function AddContactByCIDScreen({ navigation, route }) {
  // Auto-navigate when another user adds you as a contact
  useSocketNavigation();
  
  const { userCID, userNickname, addContact } = useContext(CIDContext);

  // ─── Local State ────────────────────────────────────────────
  const [otherUserCid, setOtherUserCid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [foundUser, setFoundUser] = useState(null); // { cid, nickname, avatar, status }
  const [showMyQR, setShowMyQR] = useState(false);

  // ─── Format CID with visual separators ────────────────────
  const formatCID = (cid) => {
    if (!cid) return "";
    // Example: "ABC123DEF456GHI789" -> "ABC123 - DEF456 - GHI789"
    return cid.match(/.{1,6}/g)?.join(" - ") || cid;
  };

  // ─── Copy to clipboard ──────────────────────────────────
  const handleCopyCID = () => {
    if (!userCID) return;

    // Simple copy implementation
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // In real app, use Clipboard API:
    // React.useImperativeHandle(clipboardRef, () => ({
    //   copy: () => Clipboard.setString(userCID)
    // }));
  };

  // ─── Clear inputs ──────────────────────────────────────────
  const handleClearInput = () => {
    setOtherUserCid("");
    setError("");
    setFoundUser(null);
  };

  // ─── Validate CID format ──────────────────────────────────
  const isValidCID = (cid) => {
    // CID should be alphanumeric, exactly 6 characters (A-Z, 0-9)
    return /^[A-Z0-9]{6}$/.test(cid.trim().toUpperCase());
  };

  // ─── Step 1: Search for user ────────────────────────────────
  const handleSearchUser = async () => {
    setError("");
    setSuccessMessage("");
    setFoundUser(null);

    if (!userCID) {
      setError("⚠️  Your CID is not loaded. Please try again.");
      return;
    }

    if (!otherUserCid.trim()) {
      setError("⚠️  Please enter the contact's CID");
      return;
    }

    if (!isValidCID(otherUserCid)) {
      setError("⚠️  Invalid CID format. CID must be exactly 6 alphanumeric characters.");
      return;
    }

    if (otherUserCid.toUpperCase() === userCID.toUpperCase()) {
      setError("⚠️  You cannot add yourself");
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const { otherUser } = await socketService.searchContact(otherUserCid.toUpperCase());
      setFoundUser(otherUser);
    } catch (err) {
      setError(err.message === "User not found" ? "👤 No user found with this CID." : `❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Send Connection Request ────────────────────────
  const handleSendRequest = async () => {
    if (!foundUser) return;
    
    setIsLoading(true);
    try {
      await socketService.sendConnectionRequest(foundUser.cid);
      setSuccessMessage(`✅ Request sent to "${foundUser.nickname}"!`);
      // Optional: keep foundUser but change button status
    } catch (err) {
      setError(`❌ Failed to send request: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render CID Display Card ────────────────────────────────
  const renderCIDCard = () => (
    <View style={styles.cidCard}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons
          name="shield-account"
          size={24}
          color={COLORS.primary}
        />
        <Text style={styles.cardTitle}>Your Contact ID</Text>
      </View>

      <View style={styles.cidDisplayBox}>
        <Text style={styles.cidText}>{formatCID(userCID) || "Loading..."}</Text>
        <View style={styles.cidActions}>
          <TouchableOpacity
            style={[styles.cidButton, copied && styles.cidButtonActive]}
            onPress={handleCopyCID}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={copied ? "check" : "content-copy"}
              size={18}
              color={copied ? COLORS.success : COLORS.primary}
            />
            <Text
              style={[
                styles.cidButtonText,
                copied && { color: COLORS.success },
              ]}
            >
              {copied ? "Copied!" : "Copy"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cidButton}
            onPress={() => setShowMyQR(!showMyQR)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="qrcode"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.cidButtonText}>QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showMyQR && (
        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <MaterialCommunityIcons
              name="qrcode"
              size={100}
              color={COLORS.primary}
            />
            <Text style={styles.qrText}>Scan to add me</Text>
          </View>
        </View>
      )}

      <View style={styles.cidHint}>
        <Ionicons name="information-circle" size={16} color={COLORS.primary} />
        <Text style={styles.hintText}>
          Share this ID with friends so they can find and message you.
        </Text>
      </View>
    </View>
  );

  // ─── Render Add Contact Section ─────────────────────────────
  const renderAddContactSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Add a Contact</Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter their Contact ID"
            placeholderTextColor={COLORS.textMuted}
            value={otherUserCid}
            onChangeText={setOtherUserCid}
            editable={!isLoading}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            selectionColor={COLORS.primary}
          />
          {otherUserCid && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearInput}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Character counter */}
        <Text style={styles.charCounter}>
          {otherUserCid.length}/20 characters
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={18}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Success Message */}
      {successMessage && (
        <View style={styles.successBanner}>
          <MaterialCommunityIcons
            name="check-circle"
            size={18}
            color={COLORS.success}
          />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* Found User Profile */}
      {foundUser && !successMessage && (
        <View style={styles.foundUserCard}>
          <View style={styles.foundAvatar}>
            <Text style={{ fontSize: 40 }}>{foundUser.avatar || "👤"}</Text>
          </View>
          <View style={styles.foundInfo}>
            <Text style={styles.foundNickname}>{foundUser.nickname}</Text>
            <Text style={styles.foundCid}>{foundUser.cid}</Text>
          </View>
        </View>
      )}

      {/* Dynamic Action Button */}
      {foundUser && !successMessage ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleSendRequest}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>Send Connection Request</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.addButton,
            (isLoading || !otherUserCid.trim()) && styles.addButtonDisabled,
          ]}
          onPress={handleSearchUser}
          disabled={isLoading || !otherUserCid.trim() || !!successMessage}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.addButtonText}>Searching...</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.addButtonText}>{successMessage ? "Done" : "Search User"}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Tips */}
      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>💡 Tips:</Text>
        <Text style={styles.tipsText}>
          • Contact IDs are exactly 16 alphanumeric characters
        </Text>
        <Text style={styles.tipsText}>• Example: ABC123DEF456GHI7</Text>
        <Text style={styles.tipsText}>
          • Once added, you'll be able to message immediately
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Contact by ID</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* My CID Card */}
        {renderCIDCard()}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Add Contact Section */}
        {renderAddContactSection()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: "700",
  },
  headerPlaceholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // ─── CID Card ───────────────────────────────────────────────
  cidCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    fontWeight: "700",
  },
  cidDisplayBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  cidText: {
    ...TYPOGRAPHY.h6,
    color: COLORS.primary,
    fontFamily: "monospace",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: SPACING.md,
    fontWeight: "600",
  },
  cidActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: SPACING.sm,
  },
  cidButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
  },
  cidButtonActive: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  cidButtonText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.primary,
    fontWeight: "600",
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  qrPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    width: 120,
    height: 120,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  qrText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.primary,
    fontWeight: "600",
  },
  cidHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primary + "08",
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  hintText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.text,
    flex: 1,
  },

  // ─── Divider ─────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },

  // ─── Add Contact Section ────────────────────────────────────
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.text,
    fontWeight: "700",
    marginBottom: SPACING.md,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 50,
    ...SHADOWS.sm,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body2,
    color: COLORS.text,
    padding: 0,
  },
  clearBtn: {
    padding: SPACING.xs,
  },
  charCounter: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: "right",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.error + "10",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error + "30",
    gap: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.error,
    flex: 1,
    fontWeight: "500",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success + "10",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success + "30",
    gap: SPACING.sm,
  },
  successText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.success,
    flex: 1,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },
  addButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    fontWeight: "700",
  },
  tipsBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  tipsTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  tipsText: {
    ...TYPOGRAPHY.body3,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  foundUserCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  foundAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  foundInfo: {
    flex: 1,
  },
  foundNickname: {
    ...TYPOGRAPHY.h6,
    color: COLORS.text,
    fontWeight: "700",
  },
  foundCid: {
    ...TYPOGRAPHY.body3,
    color: COLORS.textMuted,
  },
});
