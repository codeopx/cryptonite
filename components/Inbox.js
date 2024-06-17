import React, { useEffect, useState, useCallback } from "react";
import { Box, Heading, VStack, Text, Flex, Avatar, IconButton, Spinner, useToast } from "@chakra-ui/react";
import { FiMessageSquare } from "react-icons/fi";
import { useRouter } from "next/router";
import { useChat } from "@/context/chatContext";
import { useParse } from "@/context/parseContext";

const Inbox = () => {
  const { currentUser } = useParse();
  const { fetchMessages, newMessage } = useChat();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  const loadMessages = useCallback(async () => {
    try {
      const fetchedMessages = await fetchMessages(currentUser.id, true);
      const sortedMessages = fetchedMessages.sort((a, b) => new Date(b.sentAt.iso) - new Date(a.sentAt.iso));
      setMessages(sortedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, fetchMessages]);

  useEffect(() => {
    if (currentUser) {
      loadMessages();
    }
  }, [currentUser, loadMessages]);

  useEffect(() => {
    if (newMessage && !messages.some((msg) => msg.objectId === newMessage.objectId)) {
      setMessages((prevMessages) => [newMessage, ...prevMessages]);
      toast({
        title: "New Message.",
        description: `You have received a new message from ${newMessage.sender.username}.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [newMessage, toast, messages]);

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleReply = (senderId) => {
    router.push(`/chat?receiverId=${senderId}`);
  };

  if (loading) {
    return (
      <Box p={6} maxW="lg" mx="auto" bg="#121212" color="white">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box p={6} maxW="lg" mx="auto" bg="#121212" color="white">
        <Text>No messages received.</Text>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="lg" mx="auto" bg="#121212" color="white">
      <Flex align="center" mb={4}>
        <Avatar size="lg" src={currentUser.get("avatarUrl")} />
        <VStack align="start" ml={4} spacing={0}>
          <Heading size="md" color="purple.400">{currentUser.get("username")}</Heading>
        </VStack>
      </Flex>
      <Heading size="md" mb={4}>Inbox ({messages.length} messages)</Heading>
      <VStack spacing={4} align="stretch">
        {messages.map((message) => (
          <Flex key={message.objectId} p={4} bg="gray.700" borderRadius="md" shadow="md" align="center">
            <Avatar size="md" src={message.sender.avatarUrl} />
            <VStack align="start" ml={4} spacing={0} flex="1">
              <Text fontWeight="bold" color="purple.400">{message.sender.username}</Text>
              <Text>{message.content}</Text>
              <Text fontSize="xs" color="gray.400">{formatTime(message.sentAt.iso)}</Text>
            </VStack>
            <IconButton
              icon={<FiMessageSquare />}
              colorScheme="purple"
              onClick={() => handleReply(message.sender.objectId)}
              aria-label="Reply"
            />
          </Flex>
        ))}
      </VStack>
    </Box>
  );
};

export default Inbox;
