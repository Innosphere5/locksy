import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BlockedScreen = ({ route }) => {
  const { reason } = route.params || {};

  useEffect(() => {
    if (reason === 'USER_BLOCKED' || reason === 'USER_NUKE') {
      // Small delay to allow the screen to mount and show the status before redirecting
      const timer = setTimeout(() => {
        Linking.openURL('https://google.com');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [reason]);

  const content = {
    APP_DISABLED: {
      title: 'Access Revoked',
      subtitle: 'This application has been remotely disabled by the system administrator.',
      action: 'Contact Support',
      onPress: () => Linking.openURL('mailto:support@locksy.com'),
    },
    FORCE_UPDATE: {
      title: 'Update Required',
      subtitle: 'A critical security update is required to continue using Locksy.',
      action: 'Update Now',
      onPress: () => Linking.openURL('https://locksy.com/update'),
    },
    USER_BLOCKED: {
      title: 'Unauthorized Access',
      subtitle: 'Your employee access has been restricted by the administrator.',
      action: 'Continue to Support',
      onPress: () => Linking.openURL('https://google.com'), // Redirect as requested
    },
    USER_NUKE: {
      title: 'TERMINATED',
      subtitle: "Critical Security Protocol Active: You can't access this application anymore.",
      action: 'Exit System',
      onPress: () => Linking.openURL('https://google.com'),
    },
  }[reason] || {
    title: 'Security Block',
    subtitle: 'Your access to this application is currently restricted.',
    action: 'Close',
    onPress: () => {},
  };

  return (
    <LinearGradient
      colors={['#450a0a', '#0f172a']}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <View style={styles.lockIcon}>
          <Text style={styles.lockText}>🔒</Text>
        </View>
      </View>
      
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.subtitle}>{content.subtitle}</Text>

      <TouchableOpacity style={styles.button} onPress={content.onPress}>
        <Text style={styles.buttonText}>{content.action}</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Security Protocol LKSY-99</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  lockIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  lockText: {
    fontSize: 40,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    color: '#475569',
    fontSize: 12,
    letterSpacing: 2,
  }
});

export default BlockedScreen;
