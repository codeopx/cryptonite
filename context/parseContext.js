import { createContext, useContext, useState, useEffect } from 'react';
import Parse from '../parseConfig';

const ParseContext = createContext();

const definePostSchema = async () => {
  try {
    const response = await Parse.Cloud.run("definePostSchema");
    console.log(response);
  } catch (error) {
    console.error('Error while defining schema:', error.message);
  }
};

export const ParseProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await Parse.User.currentAsync();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    const initializeSchema = async () => {
      await definePostSchema();
    };

    getCurrentUser();
    initializeSchema();
  }, []);

  const refreshSession = async () => {
    try {
      if (currentUser) {
        await currentUser.fetch();
        setCurrentUser(Parse.User.current());
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
  };

  return (
    <ParseContext.Provider value={{ Parse, currentUser, refreshSession }}>
      {children}
    </ParseContext.Provider>
  );
};

export const useParse = () => useContext(ParseContext);

export default ParseContext;
