// components/Chat.js
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Input, IconButton, VStack, Text, Flex, Avatar, HStack, Spinner, useToast } from "@chakra-ui/react";
import { motion } from 'framer-motion';
import { useChat } from '@/context/chatContext';
import { useParse } from '@/context/parseContext';
import { FaPaperPlane, FaTrash } from 'react-icons/fa';
import Parse from 'parse/dist/parse';



const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";


const MotionBox = motion(Box);

const Chat = ({ receiverId }) => {
  const { messages, sendMessage, fetchMessages, deleteMessage } = useChat();
  const { currentUser } = useParse();
  const [content, setContent] = useState('');
  const [receiver, setReceiver] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const toast = useToast();

  const fetchReceiverDetails = useCallback(async (userId) => {
    const query = new Parse.Query(Parse.User);
    const user = await query.get(userId);
    setReceiver(user.toJSON());
  }, []);

  useEffect(() => {
    fetchMessages(receiverId);
    fetchReceiverDetails(receiverId);
  }, [receiverId, fetchMessages, fetchReceiverDetails]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSending(true);
    await sendMessage(receiverId, content);
    setContent('');
    setIsSending(false);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      setDeletingMessageId(messageId);
      setTimeout(async () => {
        await deleteMessage(messageId);
        fetchMessages(receiverId);
        toast({
          title: "Message Deleted.",
          description: "Your message has been deleted.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setDeletingMessageId(null);
      }, 500); // Match the duration of the animation
    } catch (error) {
      console.error('Error while deleting message:', error);
      toast({
        title: "Error.",
        description: `There was an error deleting the message: ${error.message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const dust = {
    hidden: { opacity: 1, scale: 1 },
    visible: { opacity: 0, scale: 0.5, transition: { duration: 0.5 } }
  };

  return (
    <Box p={6} maxW="lg" mx="auto" bg="#121212">
      {receiver && (
        <Flex align="center" mb={6} p={4} bg="#121212" borderRadius="md" shadow="md" borderColor="white" borderWidth="1px">
          <Avatar size="lg" src={receiver.avatarUrl} />
          <VStack align="start" ml={4} spacing={0}>
            <Text fontWeight="bold" fontSize="lg" color="white">{receiver.username}</Text>
            <Text fontSize="sm" color="gray.300">Chat with {receiver.username}</Text>
          </VStack>
        </Flex>
      )}
      <VStack spacing={4} align="stretch">
        <Box border="1px" borderColor="white" borderRadius="md" p={4} maxHeight="400px" overflowY="auto" bg="#121212" shadow="md">
          {messages.map((message) => (
            <MotionBox
              key={message.objectId}
              initial="hidden"
              animate={deletingMessageId === message.objectId ? "visible" : "hidden"}
              variants={dust}
            >
              <Flex justify={message.sender.objectId === currentUser.id ? 'flex-end' : 'flex-start'} mb={2} position="relative">
                <HStack align="start" maxW="80%" spacing={2}>
                  {message.sender.objectId !== currentUser.id && <Avatar size="sm" src={message.sender.avatarUrl} />}
                  <Box bg={message.sender.objectId === currentUser.id ? '#6b46c1' : 'gray.700'} color="white" p={3} borderRadius="md" shadow="md" position="relative">
                    <Text>{message.content}</Text>
                    <Text fontSize="xs" color="gray.400" mt={2}>
                      {formatTime(message.sentAt.iso)}
                    </Text>
                    {message.sender.objectId === currentUser.id && (
                      <Flex position="absolute" top="0" right="0" transform="translate(50%, -50%)">
                        <IconButton
                          size="sm"
                          icon={<FaTrash />}
                          colorScheme="red"
                          onClick={() => handleDeleteMessage(message.objectId)}
                          aria-label="Delete message"
                        />
                      </Flex>
                    )}
                  </Box>
                  {message.sender.objectId === currentUser.id && <Avatar size="sm" src={currentUser.get("avatarUrl")} />}
                </HStack>
              </Flex>
            </MotionBox>
          ))}
        </Box>
        <form onSubmit={handleSendMessage}>
          <Flex>
            <Input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              bg="#121212"
              color="white"
              borderRadius="md"
              _placeholder={{ color: 'gray.400' }}
              mr={2}
              focusBorderColor="purple.400"
            />
            <IconButton
              type="submit"
              colorScheme="purple"
              aria-label="Send message"
              icon={isSending ? <Spinner size="sm" /> : <FaPaperPlane />}
              borderRadius="md"
              isDisabled={isSending}
            />
          </Flex>
        </form>
      </VStack>
    </Box>
  );
};

export default Chat;
