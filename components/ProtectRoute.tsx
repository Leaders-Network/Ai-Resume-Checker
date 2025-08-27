import React, { useEffect, ReactNode } from 'react';
import useAuth from '@/app/hooks/useAuth';

interface ProtectRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ProtectRoute: React.FC<ProtectRouteProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.replace('/signin');
    }
  }, [loading, user]);

  // Show loading or redirect state
  if (loading || !user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

ProtectRoute.displayName = 'ProtectRoute';

export default ProtectRoute;