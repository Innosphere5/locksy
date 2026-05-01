import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { verifyUser } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

const LoginScreen = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { login } = useAuth();

  const handleContinue = async () => {
    if (!employeeId.trim()) {
      Alert.alert('Required', 'Please enter your Employee ID');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyUser(employeeId);

      if (response.allowed && response.token) {
        await login(response.token, employeeId);
        if (response.action === 'nuke') {
          navigation.replace('Blocked', { reason: 'USER_NUKE' });
        } else {
          navigation.replace('Home');
        }
      } else {
        // Handle blocked or nuked users
        if (response.status === 403 || response.action || response.error?.toLowerCase().includes('disabled')) {
           navigation.replace('Blocked', { reason: response.action === 'nuke' ? 'USER_NUKE' : 'USER_BLOCKED' });
        } else {
           Alert.alert('Access Denied', response.error || 'Invalid Employee ID or Device mismatch.');
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        const action = error.response.data?.action;
        navigation.replace('Blocked', { reason: action === 'nuke' ? 'USER_NUKE' : 'USER_BLOCKED' });
      } else {
        Alert.alert('Error', 'Unable to connect to security server.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Locksy</Text>
          <Text style={styles.subtitle}>Enter your credentials to access the secure portal</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMPLOYEE ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. EMP-12345"
              placeholderTextColor="#64748b"
              value={employeeId}
              onChangeText={setEmployeeId}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isVerifying && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure Device Binding Active</Text>
          <View style={styles.securityDot} />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
  form: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    height: 56,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
    letterSpacing: 1,
  },
  securityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginLeft: 8,
  },
});

export default LoginScreen;
