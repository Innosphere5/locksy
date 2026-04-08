import React, { createContext, useContext, useState, useCallback } from 'react';
import { COLORS } from '../theme';

const GroupsContext = createContext();

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error('useGroups must be used within GroupsProvider');
  }
  return context;
};

// Initial sample groups data
const INITIAL_GROUPS = [
  {
    id: '1',
    name: 'OP-SECTOR-7',
    description: 'Field team Alpha secure coordination',
    members: 5,
    badge: 'CLOSED',
    badgeColor: COLORS.badgeClosed,
    badgeText: COLORS.badgeClosedText,
    time: '08:12',
    unread: 1,
    e2ee: true,
    mode: 'closed',
    admin: 'Ghost_Fox',
    avatar: '👥',
    avatarBg: '#DBEAFE',
    createdAt: new Date().toISOString(),
    memberList: [
      { id: '1', name: 'Ghost_Fox', role: 'ADMIN', nickname: 'Ghost_Fox', status: 'online' },
      { id: '2', name: 'Shadow_Wolf', role: 'MEMBER', nickname: 'Shadow_Wolf', status: 'offline' },
      { id: '3', name: 'Iron_Mask', role: 'MEMBER', nickname: 'Iron_Mask', status: 'online' },
      { id: '4', name: 'CipherX', role: 'MEMBER', nickname: 'CipherX', status: 'offline' },
      { id: '5', name: 'NightOwl', role: 'MEMBER', nickname: 'NightOwl', status: 'online' },
    ],
    pendingRequests: [
      { id: 'req1', name: 'New_User_01', time: '5 min ago' },
      { id: 'req2', name: 'DarkRunner_X', time: '12 min ago' },
      { id: 'req3', name: 'Cipher_99', time: '1h ago' },
    ],
  },
  {
    id: '2',
    name: 'Alpha Team',
    description: 'Team coordination and updates',
    members: 3,
    badge: 'APPROVAL',
    badgeColor: COLORS.badgeApproval,
    badgeText: COLORS.badgeApprovalText,
    time: 'Yesterday',
    unread: 0,
    e2ee: true,
    mode: 'approval',
    admin: 'Shadow_Wolf',
    avatar: '👥',
    avatarBg: '#DBEAFE',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    memberList: [
      { id: '2', name: 'Shadow_Wolf', role: 'ADMIN', nickname: 'Shadow_Wolf', status: 'offline' },
      { id: '3', name: 'Iron_Mask', role: 'MEMBER', nickname: 'Iron_Mask', status: 'online' },
      { id: '6', name: 'Phantom_Recon', role: 'MEMBER', nickname: 'Phantom_Recon', status: 'offline' },
    ],
    pendingRequests: [],
  },
];

export const GroupsProvider = ({ children }) => {
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  /**
   * Create a new group
   * @param {Object} groupData - { name, description, mode, memberIds }
   * @returns {Object} Created group
   */
  const createGroup = useCallback((groupData) => {
    const newGroup = {
      id: String(Date.now()),
      name: groupData.name,
      description: groupData.description || '',
      members: (groupData.memberIds || []).length + 1, // +1 for creator
      badge: groupData.mode === 'closed' ? 'CLOSED' : 'APPROVAL',
      badgeColor: groupData.mode === 'closed' ? COLORS.badgeClosed : COLORS.badgeApproval,
      badgeText: groupData.mode === 'closed' ? COLORS.badgeClosedText : COLORS.badgeApprovalText,
      time: 'now',
      unread: 0,
      e2ee: true,
      mode: groupData.mode,
      admin: groupData.creator || 'You',
      avatar: '👥',
      avatarBg: '#DBEAFE',
      createdAt: new Date().toISOString(),
      memberList: [
        {
          id: '0',
          name: groupData.creator || 'You',
          role: 'ADMIN',
          nickname: groupData.creator || 'You',
          status: 'online',
        },
        ...(groupData.members || []),
      ],
      pendingRequests: groupData.mode === 'approval' ? (groupData.members || []) : [],
    };

    setGroups((prev) => [newGroup, ...prev]);
    return newGroup;
  }, []);

  /**
   * Get group by ID
   */
  const getGroup = useCallback(
    (groupId) => {
      return groups.find((g) => g.id === groupId);
    },
    [groups]
  );

  /**
   * Get all groups
   */
  const getAllGroups = useCallback(() => {
    return groups;
  }, [groups]);

  /**
   * Update group
   */
  const updateGroup = useCallback((groupId, updates) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              ...updates,
            }
          : g
      )
    );
  }, []);

  /**
   * Delete group
   */
  const deleteGroup = useCallback((groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
  }, [selectedGroupId]);

  /**
   * Add member to group
   */
  const addMember = useCallback((groupId, member) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const memberExists = g.memberList.some((m) => m.id === member.id);
          if (!memberExists) {
            return {
              ...g,
              memberList: [...g.memberList, { ...member, role: 'MEMBER' }],
              members: g.members + 1,
            };
          }
        }
        return g;
      })
    );
  }, []);

  /**
   * Remove member from group
   */
  const removeMember = useCallback((groupId, memberId) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            memberList: g.memberList.filter((m) => m.id !== memberId),
            members: g.members - 1,
          };
        }
        return g;
      })
    );
  }, []);

  /**
   * Approve member request
   */
  const approveMemberRequest = useCallback((groupId, requestId, memberData) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            pendingRequests: g.pendingRequests.filter((r) => r.id !== requestId),
            memberList: [
              ...g.memberList,
              {
                id: requestId,
                ...memberData,
                role: 'MEMBER',
                status: 'offline',
              },
            ],
            members: g.members + 1,
          };
        }
        return g;
      })
    );
  }, []);

  /**
   * Reject member request
   */
  const rejectMemberRequest = useCallback((groupId, requestId) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            pendingRequests: g.pendingRequests.filter((r) => r.id !== requestId),
          };
        }
        return g;
      })
    );
  }, []);

  /**
   * Update member role
   */
  const updateMemberRole = useCallback((groupId, memberId, role) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            memberList: g.memberList.map((m) =>
              m.id === memberId ? { ...m, role } : m
            ),
          };
        }
        return g;
      })
    );
  }, []);

  const value = {
    groups,
    selectedGroupId,
    setSelectedGroupId,
    createGroup,
    getGroup,
    getAllGroups,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    approveMemberRequest,
    rejectMemberRequest,
    updateMemberRole,
  };

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
};
