import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import CustomizableDashboard from '../components/CustomizableDashboard';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="bg-yellow-100 p-4 rounded-lg mb-4">
            <p className="text-yellow-600 font-medium">Please log in to view your dashboard</p>
            <p className="text-sm text-yellow-500 mt-2">You need to be authenticated to access this page</p>
          </div>
        </div>
      </div>
    );
  }

  return <CustomizableDashboard userId={currentUser.uid} />;
};

export default Dashboard;