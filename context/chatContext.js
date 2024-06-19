import { createContext, useContext, useState, useEffect } from 'react';
import Parse from '../parseConfig';
import { useParse } from './parseContext';

const ChatContext = createContext();

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
      const savedMessage = await message.save();
      setNewMessage(savedMessage.toJSON());
      setMessages(prevMessages => [...prevMessages, savedMessage.toJSON()]);
    } catch (error) {
      console.error('Error while sending message:', error);
      throw error;
    }
  };

  const fetchMessages = async (userId) => {
    if (!currentUser) return [];

    const sentMessagesQuery = new Parse.Query('Message');
    sentMessagesQuery.equalTo('sender', currentUser);
    sentMessagesQuery.equalTo('receiver', { __type: 'Pointer', className: '_User', objectId: userId });

    const receivedMessagesQuery = new Parse.Query('Message');
    receivedMessagesQuery.equalTo('sender', { __type: 'Pointer', className: '_User', objectId: userId });
    receivedMessagesQuery.equalTo('receiver', currentUser);

    const mainQuery = Parse.Query.or(sentMessagesQuery, receivedMessagesQuery);
    mainQuery.ascending('sentAt');  // Sort messages by `sentAt` in ascending order

    try {
      const results = await mainQuery.find();
      const fetchedMessages = results.map(message => message.toJSON());
      setMessages(fetchedMessages);
      return fetchedMessages;
    } catch (error) {
      console.error('Error while fetching messages:', error);
      throw error;
    }
  };

  const fetchReceivedMessages = async () => {
    if (!currentUser) return [];

    const receivedMessagesQuery = new Parse.Query('Message');
    receivedMessagesQuery.equalTo('receiver', currentUser);
    receivedMessagesQuery.descending('sentAt');  // Sort messages by `sentAt` in descending order

    try {
      const results = await receivedMessagesQuery.find();
      const fetchedMessages = results.map(message => message.toJSON());
      setMessages(fetchedMessages);
      return fetchedMessages;
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
            setMessages(prevMessages => [...prevMessages, latestMessage]);
          }
        }
      } catch (error) {
        console.error('Error while checking for new messages:', error);
      }
    };

    const interval = setInterval(checkForNewMessages, 5000);  // Check every 5 seconds

    return () => clearInterval(interval);
  }, [currentUser, messages]);

  return (
    <ChatContext.Provider value={{ messages, sendMessage, fetchMessages, fetchReceivedMessages, deleteMessage, newMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);