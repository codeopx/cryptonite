import { createContext, useContext, useState, useEffect } from 'react';
import Parse from 'parse/dist/parse';

const ParseContext = createContext();

const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;
const PARSE_SERVER_URL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = PARSE_SERVER_URL;

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

  const addFollower = async (authorId) => {
    if (!currentUser) throw new Error("User not authenticated");
    try {
      await refreshSession(); 

      // Call Cloud Code function to follow the author
      await Parse.Cloud.run("followAuthor", { currentUser, authorId });

      // After following, update the current user's state
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