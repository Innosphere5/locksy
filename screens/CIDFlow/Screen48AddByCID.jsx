import React, { useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Clipboard,
  Alert,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { NavBar, PrimaryButton } from '../../component/CIDFlowShared';
import { CIDFlowStyles } from '../common/CIDFlowStyles';
import { useCIDContext } from '../../context/CIDContext';

/**
 * Screen 48: Add By CID Manually
 * Allows user to enter 6-character CID
 * Validates and searches for contact
 */
const Screen48AddByCID = ({ onNext, onBack }) => {
  const { setCurrentContact, addContact } = useCIDContext();
  const [cid, setCid] = useState(['', '', '', '', '', '']);
  const [activeTab, setActiveTab] = useState('enter');
  const [isValidating, setIsValidating] = useState(false);
  const inputRefs = useRef([]);

  const handleCharInput = (val, idx) => {
    const next = [...cid];
    const char = val.toUpperCase().slice(-1);
    
    // Only allow alphanumeric
    if (char && /^[A-Z0-9]$/.test(char)) {
      next[idx] = char;
      setCid(next);

      // Auto-focus next field
      if (char && idx < 5) {
        inputRefs.current[idx + 1]?.focus();
      }
    }
  };

  const handleBackspace = (idx) => {
    if (idx > 0 && !cid[idx]) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getString();
      const cidText = text.toUpperCase().replace(/\s+/g, '').slice(0, 6);
      
      if (cidText.length === 6 && /^[A-Z0-9]{6}$/.test(cidText)) {
        setCid(cidText.split(''));
      } else {
        Alert.alert('Invalid CID', 'CID must be 6 alphanumeric characters');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
    }
  }, []);

  const handleFindContact = useCallback(() => {
    const enteredCID = cid.join('');
    
    if (enteredCID.length !== 6) {
      Alert.alert('Incomplete', 'Please enter all 6 characters');
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(enteredCID)) {
      Alert.alert('Invalid Format', 'CID must contain only letters and numbers');
      return;
    }

    setIsValidating(true);

    // Simulate contact lookup with API delay
    setTimeout(() => {
      setIsValidating(false);

      // Mock contact data
      const mockContact = {
        cid: enteredCID,
        name: `User_${enteredCID}`,
        avatar: '👤',
        verified: false,
      };

      setCurrentContact(mockContact);
      onNext();
    }, 1500);
  }, [cid, onNext, setCurrentContact]);

  return (
    <SafeAreaView style={CIDFlowStyles.safeAreaWhite}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <NavBar title="Add Contact" onBack={onBack} />

      <ScrollView contentContainerStyle={CIDFlowStyles.scrollContent}>
        {/* Tab Toggle */}
        <View style={CIDFlowStyles.tabRow}>
          <TouchableOpacity
            style={[
              CIDFlowStyles.tab,
              activeTab === 'scan' && CIDFlowStyles.tabActive,
            ]}
            onPress={() => setActiveTab('scan')}
          >
            <Text
              style={[
                CIDFlowStyles.tabText,
                activeTab === 'scan' && CIDFlowStyles.tabTextActive,
              ]}
            >
              ▦ Scan QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              CIDFlowStyles.tab,
              activeTab === 'enter' && CIDFlowStyles.tabActive,
            ]}
            onPress={() => setActiveTab('enter')}
          >
            <Text
              style={[
                CIDFlowStyles.tabText,
                activeTab === 'enter' && CIDFlowStyles.tabTextActive,
              ]}
            >
              ⌨ Enter CID
            </Text>
          </TouchableOpacity>
        </View>

        {/* Field Label */}
        <Text style={CIDFlowStyles.fieldLabel}>Enter CID (6 characters)</Text>

        {/* 6-Character Input Row */}
        <View style={CIDFlowStyles.cidInputRow}>
          {cid.map((ch, i) => (
            <TextInput
              key={i}
              ref={(r) => (inputRefs.current[i] = r)}
              style={[
                CIDFlowStyles.cidInputCell,
                cid[i] && { borderStyle: 'solid', backgroundColor: COLORS.white },
              ]}
              value={ch}
              maxLength={1}
              autoCapitalize="characters"
              onChangeText={(v) => handleCharInput(v, i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !ch) {
                  handleBackspace(i);
                }
              }}
              keyboardType="default"
              placeholder="_"
              placeholderTextColor={COLORS.textMuted}
              editable={!isValidating}
            />
          ))}
        </View>

        {/* Paste from Clipboard */}
        <TouchableOpacity
          style={CIDFlowStyles.pasteRow}
          onPress={handlePaste}
          activeOpacity={0.7}
          disabled={isValidating}
        >
          <Text style={CIDFlowStyles.pasteIcon}>📋</Text>
          <Text style={CIDFlowStyles.pasteText}>Paste from clipboard</Text>
        </TouchableOpacity>

        {/* Hint Box */}
        <View style={CIDFlowStyles.hintBox}>
          <Text style={CIDFlowStyles.hintText}>
            💡 Ask contact to share CID from their profile. 6 characters:
            letters and numbers.
          </Text>
        </View>

        {/* Find Contact Button */}
        <PrimaryButton
          label={isValidating ? '🔍 Finding...' : '🔍 Find Contact'}
          onPress={handleFindContact}
          style={{ marginTop: 32, width: '100%' }}
          loading={isValidating}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Screen48AddByCID;
