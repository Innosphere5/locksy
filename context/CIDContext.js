import React, { createContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export const CIDContext = createContext();

export const CIDProvider = ({ children }) => {
  const [userCID, setUserCIDState] = useState('A7F3K9');
  const [userNickname, setUserNicknameState] = useState('');
  const [userAvatar, setUserAvatarState] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [currentContact, setCurrentContact] = useState(null);
  const [scannedCID, setScannedCID] = useState(null);
  const [enteredCID, setEnteredCID] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedCID = await SecureStore.getItemAsync('user_identity_cid');
        const storedName = await SecureStore.getItemAsync('user_identity_nickname');
        const storedImg = await SecureStore.getItemAsync('user_identity_avatar');
        
        if (storedCID) setUserCIDState(storedCID);
        if (storedName) setUserNicknameState(storedName);
        if (storedImg) setUserAvatarState(storedImg);
      } catch (e) {
        console.error('Failure to load profile:', e);
      }
    };
    loadProfile();
  }, []);

  const setUserCID = useCallback(async (cid) => {
    setUserCIDState(cid);
    try {
      await SecureStore.setItemAsync('user_identity_cid', cid);
    } catch (e) {
      console.error('Failure to save cid:', e);
    }
  }, []);

  const updateNickname = useCallback(async (name) => {
    setUserNicknameState(name);
    try {
      await SecureStore.setItemAsync('user_identity_nickname', name);
    } catch (e) {
      console.error('Failure to save nickname:', e);
    }
  }, []);

  const updateAvatar = useCallback(async (imgUri) => {
    setUserAvatarState(imgUri);
    try {
      if (imgUri) {
        await SecureStore.setItemAsync('user_identity_avatar', imgUri);
      } else {
        await SecureStore.deleteItemAsync('user_identity_avatar');
      }
    } catch (e) {
      console.error('Failure to save avatar:', e);
    }
  }, []);

  const addContact = useCallback((contact) => {
    setContacts((prev) => [...prev, contact]);
  }, []);

  const resetCIDFlow = useCallback(() => {
    setScannedCID(null);
    setEnteredCID(['', '', '', '', '', '']);
    setCurrentContact(null);
  }, []);

  const value = {
    userCID,
    setUserCID,
    userNickname,
    updateNickname,
    userAvatar,
    updateAvatar,
    contacts,
    addContact,
    currentContact,
    setCurrentContact,
    scannedCID,
    setScannedCID,
    enteredCID,
    setEnteredCID,
    resetCIDFlow,
  };

  return <CIDContext.Provider value={value}>{children}</CIDContext.Provider>;
};

export const useCIDContext = () => {
  const context = React.useContext(CIDContext);
  if (!context) {
    throw new Error('useCIDContext must be used within CIDProvider');
  }
  return context;
};
