import { useAuth, useClerk, useUser } from "@clerk/expo";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { propertyApi } from "@/src/services/api/property.api";

type AppRole = "guest" | "user" | "admin";

interface AppSessionContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  role: AppRole;
  user: ReturnType<typeof useUser>["user"];
  signOut: () => Promise<void>;
  refreshOwnerState: () => Promise<void>;
}

const AppSessionContext = createContext<AppSessionContextValue | undefined>(undefined);

const resolveAdminClaim = (user: ReturnType<typeof useUser>["user"]) => {
  return String(user?.publicMetadata?.role || "").toUpperCase() === "ADMIN";
};

export const AppSessionProvider = ({ children }: { children: ReactNode }) => {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const getTokenRef = useRef(getToken);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerLoaded, setOwnerLoaded] = useState(false);

  // Assign ref inline — safe for refs, avoids effect firing on every
  // Clerk getToken reference cycle (getToken is a new ref each render).
  getTokenRef.current = getToken;

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

  // Stable signOut wrapper so consumers don't need to import useClerk()
  const signOut = useCallback(async () => {
    await clerkSignOut();
  }, [clerkSignOut]);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    refreshOwnerState();
  }, [authLoaded, userLoaded, isSignedIn, refreshOwnerState]);

  const role: AppRole = !isSignedIn ? "guest" : isAdmin ? "admin" : "user";

  const value = useMemo(
    () => ({
      isLoaded: authLoaded && userLoaded && ownerLoaded,
      isSignedIn: Boolean(isSignedIn),
      isAdmin,
      isOwner,
      role,
      user,
      signOut,
      refreshOwnerState,
    }),
    [authLoaded, userLoaded, ownerLoaded, isSignedIn, isAdmin, isOwner, role, user, signOut, refreshOwnerState],
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
};

export const useAppSession = () => {
  const value = useContext(AppSessionContext);
  if (!value) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }
  return value;
};
