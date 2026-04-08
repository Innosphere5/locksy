import React, { createContext, useState, useCallback } from 'react';

export const CIDContext = createContext();

export const CIDProvider = ({ children }) => {
  const [userCID, setUserCID] = useState('A7F3K9');
  const [contacts, setContacts] = useState([]);
  const [currentContact, setCurrentContact] = useState(null);
  const [scannedCID, setScannedCID] = useState(null);
  const [enteredCID, setEnteredCID] = useState(['', '', '', '', '', '']);

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
