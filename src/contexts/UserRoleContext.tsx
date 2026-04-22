import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import type { Engineer } from "../types";

interface UserRoleContextValue {
  role: "admin" | "engineer" | null;
  engineer: Engineer | null;
  loading: boolean;
}

const UserRoleContext = createContext<UserRoleContextValue>({
  role: null,
  engineer: null,
  loading: true,
});

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<"admin" | "engineer" | null>(null);
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setEngineer(null);
        setLoading(false);
        return;
      }

      try {
        const employeeId = user.email?.split("@")[0] ?? "";
        const snapshot = await getDocs(
          query(collection(db, "engineers"), where("employeeId", "==", employeeId))
        );

        if (!snapshot.empty) {
          const engineerDoc = snapshot.docs[0];
          const engineerData = { uid: engineerDoc.id, ...engineerDoc.data() } as Engineer;
          setEngineer(engineerData);
          setRole("engineer");
        } else {
          setEngineer(null);
          setRole("admin");
        }
      } catch {
        setRole("admin");
        setEngineer(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserRoleContext.Provider value={{ role, engineer, loading }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export const useUserRole = () => useContext(UserRoleContext);
