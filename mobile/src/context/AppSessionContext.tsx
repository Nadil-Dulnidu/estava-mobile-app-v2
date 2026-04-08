import { useAuth, useUser } from '@clerk/expo';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { propertyApi } from '@/src/services/api/property.api';

type AppRole = 'guest' | 'user' | 'owner' | 'admin';

interface AppSessionContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  role: AppRole;
  refreshOwnerState: () => Promise<void>;
}

const AppSessionContext = createContext<AppSessionContextValue | undefined>(undefined);

const resolveAdminClaim = (user: ReturnType<typeof useUser>['user']) => {
  const roleCandidates = [
    user?.publicMetadata?.role,
    user?.unsafeMetadata?.role,
    user?.organizationMemberships?.[0]?.role,
  ];

  return roleCandidates.some((value) => String(value || '').toUpperCase() === 'ADMIN');
};

export const AppSessionProvider = ({ children }: { children: ReactNode }) => {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const getTokenRef = useRef(getToken);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerLoaded, setOwnerLoaded] = useState(false);

  const isAdmin = useMemo(() => resolveAdminClaim(user), [user]);

  const refreshOwnerState = useCallback(async () => {
    if (!isSignedIn) {
      setIsOwner(false);
      setOwnerLoaded(true);
      return;
    }

    try {
      const response = await propertyApi.getMyProperties({ page: 1, limit: 1 }, getTokenRef.current);
      setIsOwner((response.meta?.total || 0) > 0 || response.data.length > 0);
    } catch {
      setIsOwner(false);
    } finally {
      setOwnerLoaded(true);
    }
  }, [isSignedIn]);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    refreshOwnerState();
  }, [authLoaded, userLoaded, isSignedIn, refreshOwnerState]);

  const role: AppRole = !isSignedIn ? 'guest' : isAdmin ? 'admin' : isOwner ? 'owner' : 'user';

  const value = useMemo(
    () => ({
      isLoaded: authLoaded && userLoaded && ownerLoaded,
      isSignedIn: Boolean(isSignedIn),
      isAdmin,
      isOwner,
      role,
      refreshOwnerState,
    }),
    [authLoaded, userLoaded, ownerLoaded, isSignedIn, isAdmin, isOwner, role, refreshOwnerState]
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
};

export const useAppSession = () => {
  const value = useContext(AppSessionContext);

  if (!value) {
    throw new Error('useAppSession must be used within AppSessionProvider');
  }

  return value;
};
