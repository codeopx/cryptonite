import { createContext, useContext, useState, useEffect } from 'react';
import Parse from 'parse/dist/parse';

const ParseContext = createContext();

const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";

const definePostSchema = async () => {
  const schema = new Parse.Schema('Post');

  schema.addString('content');
  schema.addArray('imageUrls');
  schema.addArray('videoUrls');
  schema.addString('link');
  schema.addArray('likedBy');
  schema.addArray('comments');
  schema.addPointer('author', '_User');

  try {
    await schema.save();
    console.log('Schema defined successfully');
  } catch (error) {
    if (error.code === 137) {
      console.log('Schema already defined');
    } else {
      console.error('Error while defining schema:', error.message);
    }
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
      await refreshSession();  // Ensure the session is refreshed before performing any actions

      // Fetch the author
      const authorQuery = new Parse.Query(Parse.User);
      const author = await authorQuery.get(authorId);

      // Check if the current user is already following the author
      let followers = author.get('followers');
      if (!Array.isArray(followers)) {
        followers = [];
      }
      const following = currentUser.get('following') || [];

      if (following.includes(authorId) || followers.includes(currentUser.id)) {
        throw new Error("You are already following this author");
      }

      // Add the current user's ID to the author's followers array
      followers.push(currentUser.id);
      author.set('followers', followers);
      author.set('followersCount', followers.length); // Ensure followersCount is set correctly
      await author.save();

      // Add the author ID to the current user's following array
      currentUser.addUnique('following', authorId);
      await currentUser.save();

      setCurrentUser(await Parse.User.currentAsync());  // Refresh the current user data
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
