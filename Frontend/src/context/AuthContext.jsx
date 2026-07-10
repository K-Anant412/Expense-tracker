import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] =useState(true);

    useEffect(() => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
        
      if ( savedUser && token ) {
        setUser( JSON.parse(savedUser) );
      }
      setLoading(false);
    }, []);
    
    const loginUser = async ( email, password ) => {
        try {
            const response = await authService.login( email, password );
            const { access_token, user: userData } = response.data;

            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(userData);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Authentication failed'
            };
        }
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {!loading && children}
    </AuthContext.Provider>
    );
    
}