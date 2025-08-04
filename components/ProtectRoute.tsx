import useAuth from '@/app/hooks/useAuth';
import { useEffect } from 'react';

const ProtectRoute = (WrappedComponent) => {
  return (props) => {
    const { user, loading } = useAuth();

    useEffect(() => {
      if (!loading && !user) {
        window.location.replace('/signin');
      }
    }, [loading, user]);

    // Return null to prevent content flash
    if (loading || !user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default ProtectRoute;