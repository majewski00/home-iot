import { useState, useEffect } from "react";
import { fetchUserAttributes } from "@aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";

interface UserAttributes {
  name?: string;
  email?: string;
  [key: string]: any; // To handle additional attributes if needed
}

interface UseUserAttributesReturn {
  attributes: UserAttributes | null;
  loading: boolean;
  error: Error | null;
  userAttributesReady: boolean;
  getUserFullName: () => string;
  getNameInitial: () => string;
}

/**
 * Custom hook for fetching and managing user attributes
 * @returns {UseUserAttributesReturn} Object containing user attributes and loading state
 */
export function useUserAttributes(): UseUserAttributesReturn {
  const { user } = useAuthenticator((context) => [context.user]);
  const [attributes, setAttributes] = useState<UserAttributes | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [userAttributesReady, setUserAttributesReady] =
    useState<boolean>(false);

  useEffect(() => {
    async function loadUserAttributes() {
      if (!user) {
        setAttributes(null);
        setLoading(false);
        setUserAttributesReady(false);
        return;
      }

      try {
        setLoading(true);
        setUserAttributesReady(false);
        const userAttributes = await fetchUserAttributes();
        setAttributes(userAttributes as UserAttributes);
        setError(null);
        setUserAttributesReady(true);
      } catch (err) {
        console.error("Error fetching user attributes:", err);
        setError(err as Error);
        setUserAttributesReady(false);
      } finally {
        setLoading(false);
      }
    }

    loadUserAttributes();
  }, [user]);

  const getUserFullName = (): string => {
    if (loading) return "Loading...";
    if (error || !attributes) return user?.username || "User";

    return attributes.name || attributes.email || "User";
  };

  const getNameInitial = (): string => {
    const name = getUserFullName();
    return name && name !== "Loading..." && name !== "User"
      ? name.charAt(0).toUpperCase()
      : "U";
  };

  return {
    attributes,
    loading,
    error,
    userAttributesReady,
    getUserFullName,
    getNameInitial,
  };
}
