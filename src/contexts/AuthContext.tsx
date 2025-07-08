import React, { createContext, useContext, useEffect, useState } from 'react';

// Mock User interface to match Firebase User
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: MockUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock authentication for development
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate loading and check for existing session
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if user was previously logged in
      const savedUser = localStorage.getItem('phantompay_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('phantompay_user');
        }
      }
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock successful login
    const mockUser: MockUser = {
      uid: `user_${Date.now()}`,
      email,
      displayName: email.split('@')[0]
    };
    
    setCurrentUser(mockUser);
    localStorage.setItem('phantompay_user', JSON.stringify(mockUser));
  };

  const register = async (email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock successful registration
    const mockUser: MockUser = {
      uid: `user_${Date.now()}`,
      email,
      displayName: email.split('@')[0]
    };
    
    setCurrentUser(mockUser);
    localStorage.setItem('phantompay_user', JSON.stringify(mockUser));
  };

  const loginWithGoogle = async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock successful Google login
    const mockUser: MockUser = {
      uid: `google_user_${Date.now()}`,
      email: 'demo@gmail.com',
      displayName: 'Demo User'
    };
    
    setCurrentUser(mockUser);
    localStorage.setItem('phantompay_user', JSON.stringify(mockUser));
  };

  const logout = async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentUser(null);
    localStorage.removeItem('phantompay_user');
  };

  const value = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};