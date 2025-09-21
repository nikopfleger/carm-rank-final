"use client";

import { useRoleAssignment } from "@/hooks/use-role-assignment";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

function RoleAssignmentWrapper({ children }: Props) {
  useRoleAssignment();
  return <>{children}</>;
}

export default function AuthSessionProvider({ children }: Props) {
  return (
    <SessionProvider
      refetchInterval={0} // No refetch automático
      refetchOnWindowFocus={false} // No refetch al cambiar de ventana
      refetchWhenOffline={false} // No refetch cuando está offline
    >
      <RoleAssignmentWrapper>
        {children}
      </RoleAssignmentWrapper>
    </SessionProvider>
  );
}
