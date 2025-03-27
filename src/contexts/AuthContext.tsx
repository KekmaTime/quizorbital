import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authAPI, userAPI, UserProfile } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  error: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  refreshToken: async () => false,
});

// Create a hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if token exists and is valid on initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Check if token is expired
          const decodedToken: any = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token is expired, try to refresh
            await refreshToken();
          } else {
            // Token is valid, get user profile
            const response = await userAPI.getProfile();
            setCurrentUser(response.data);
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      
      // Get user profile
      const userResponse = await userAPI.getProfile();
      setCurrentUser(userResponse.data);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await authAPI.register({ name, email, password });
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      
      // Get user profile
      const userResponse = await userAPI.getProfile();
      setCurrentUser(userResponse.data);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await authAPI.refreshToken();
      localStorage.setItem('token', response.data.token);
      
      // Get user profile
      const userResponse = await userAPI.getProfile();
      setCurrentUser(userResponse.data);
      
      return true;
    } catch (err) {
      localStorage.removeItem('token');
      setCurrentUser(null);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    
    // Call logout API endpoint
    try {
      authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  // Context value
  const value: AuthContextType = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 