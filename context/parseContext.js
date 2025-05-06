import { createContext, useContext, useState, useEffect } from 'react';
import Parse from '../parseConfig';

const ParseContext = createContext();

const definePostSchema = async () => {
  try {
    const response = await Parse.Cloud.run("definePostSchema");
    console.log('Schema defined:', response);
  } catch (error) {
    console.error('Error while defining schema:', error.message);
  }
};

export const ParseProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await definePostSchema();
        const user = await Parse.User.currentAsync();
        setCurrentUser(user);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();
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

  const addFollower = async (authorId) => {
    if (!currentUser) throw new Error("User not authenticated");
    try {
      await refreshSession(); 
      await Parse.Cloud.run("followAuthor", { userID: currentUser.id, authorID: authorId });
      setCurrentUser(await Parse.User.currentAsync()); 
    } catch (error) {
      console.error('Error while following author:', error);
      throw error;
    }
  };

  return (
    <ParseContext.Provider value={{ Parse, currentUser, addFollower }}>
      {children}
    </ParseContext.Provider>
  );
};

export const useParse = () => useContext(ParseContext);

export default ParseContext;
