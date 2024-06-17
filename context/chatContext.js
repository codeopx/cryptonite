// context/chatContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import Parse from 'parse/dist/parse';
import { useParse } from './parseContext';

const ChatContext = createContext();


const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";


export const ChatProvider = ({ children }) => {
  const { currentUser } = useParse();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(null);

  const sendMessage = async (receiverId, content) => {
    if (!currentUser) {
      throw new Error("User is not authenticated. Please log in.");
    }

    const Message = Parse.Object.extend('Message');
    const message = new Message();

    message.set('sender', currentUser);
    message.set('receiver', {
      __type: 'Pointer',
      className: '_User',
      objectId: receiverId
    });
    message.set('content', content);
    message.set('sentAt', new Date());

    try {
      await message.save();
      await fetchMessages(receiverId); // Fetch updated messages after sending a new one
    } catch (error) {
      console.error('Error while sending message:', error);
      throw error;
    }
  };

  const fetchMessages = async (userId, receivedOnly = false) => {
    const query = new Parse.Query('Message');
    query.equalTo('receiver', currentUser);
    if (!receivedOnly) {
      query.equalTo('sender', currentUser);
      query.equalTo('receiver', {
        __type: 'Pointer',
        className: '_User',
        objectId: userId
      });
    }
    query.ascending('sentAt');
    try {
      const results = await query.find();
      setMessages(results.map(message => message.toJSON()));
      return results.map(message => message.toJSON());
    } catch (error) {
      console.error('Error while fetching messages:', error);
      throw error;
    }
  };

  const deleteMessage = async (messageId) => {
    const Message = Parse.Object.extend('Message');
    const query = new Parse.Query(Message);

    try {
      const message = await query.get(messageId);
      await message.destroy();
      setMessages(prevMessages => prevMessages.filter(msg => msg.objectId !== messageId));
    } catch (error) {
      console.error('Error while deleting message:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkForNewMessages = async () => {
      if (!currentUser) return;

      const receiverQuery = new Parse.Query('Message');
      receiverQuery.equalTo('receiver', currentUser);
      receiverQuery.descending('createdAt');
      receiverQuery.limit(1);

      try {
        const results = await receiverQuery.find();
        if (results.length > 0) {
          const latestMessage = results[0].toJSON();
          if (!messages.some(msg => msg.objectId === latestMessage.objectId)) {
            setNewMessage(latestMessage);
            setMessages(prevMessages => [latestMessage, ...prevMessages]);
          }
        }
      } catch (error) {
        console.error('Error while checking for new messages:', error);
      }
    };

    const interval = setInterval(checkForNewMessages, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [currentUser, messages]);

  return (
    <ChatContext.Provider value={{ messages, sendMessage, fetchMessages, deleteMessage, newMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
