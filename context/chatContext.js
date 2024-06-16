// context/chatContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import Parse from 'parse/dist/parse';
import { useParse } from './parseContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { currentUser } = useParse();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(null);

  const sendMessage = async (receiverId, content) => {
    if (!currentUser) throw new Error("User not authenticated");

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
      fetchMessages(receiverId);  // Fetch updated messages after sending a new one
    } catch (error) {
      console.error('Error while sending message:', error);
      throw error;
    }
  };

  const fetchMessages = async (userId, receivedOnly = false) => {
    const receiverQuery = new Parse.Query('Message');
    receiverQuery.equalTo('receiver', currentUser);
    if (receivedOnly) {
      // Only fetch received messages
      receiverQuery.ascending('sentAt');
    } else {
      // Fetch both sent and received messages
      const senderQuery = new Parse.Query('Message');
      senderQuery.equalTo('sender', currentUser);
      senderQuery.equalTo('receiver', {
        __type: 'Pointer',
        className: '_User',
        objectId: userId
      });
      const mainQuery = Parse.Query.or(senderQuery, receiverQuery);
      mainQuery.ascending('sentAt');
      const results = await mainQuery.find();
      setMessages(results.map(message => message.toJSON()));
      return results.map(message => message.toJSON());
    }
    const results = await receiverQuery.find();
    setMessages(results.map(message => message.toJSON()));
    return results.map(message => message.toJSON());
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
