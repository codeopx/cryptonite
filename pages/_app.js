import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Stack, Button, ChakraProvider, Avatar, Text, Heading, Flex, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Input, useToast
} from "@chakra-ui/react";
import Post from '@/components/posts';
import CreatePost from '@/components/createPost';
import { ParseProvider, useParse } from '@/context/parseContext';
import { ChatProvider } from '@/context/chatContext';
import Chat from '@/components/Chat';
import Inbox from '@/components/Inbox';
import Header from '@/components/header';
import Link from 'next/link';
import moment from 'moment';

const getTimeDifference = (date) => {
  const now = moment();
  const postDate = moment(date);
  const difference = now.diff(postDate, 'hours');

  if (difference < 24) {
    return `${difference} hours ago`;
  } else {
    return postDate.format('MMM D, YYYY');
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary: ", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

const App = () => {
  const { Parse, currentUser, addFollower } = useParse();
  const [posts, setPosts] = useState([]);
  const [authorDetails, setAuthorDetails] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const [view, setView] = useState('chat'); // 'chat' or 'inbox'
  const [userId, setUserId] = useState(currentUser ? currentUser.id : null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  const onClose = () => setIsOpen(false);
  const onOpen = () => setIsOpen(true);

  useEffect(() => {
    if (!Parse.applicationId) {
      Parse.initialize(process.env.NEXT_PUBLIC_PARSE_APP_ID, process.env.NEXT_PUBLIC_PARSE_JS_KEY);
      Parse.serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;
    }
  }, [Parse]);

  const fetchPosts = useCallback(async () => {
    const Post = Parse.Object.extend('Post');
    const query = new Parse.Query(Post);
    query.include('author');
    try {
      const results = await query.find();
      setPosts(results.map(post => post.toJSON()));
    } catch (error) {
      console.error('Error while fetching posts:', error);
    }
  }, [Parse]);

  const fetchAuthorDetails = useCallback(async (authorId) => {
    const query = new Parse.Query(Parse.User);
    try {
      const author = await query.get(authorId);
      const followers = author.get('followers') || [];
      return {
        id: author.id,
        username: author.get('username'),
        avatar: author.get('avatarUrl'),
        bio: author.get('bio'),
        followersCount: author.get('followersCount') || followers.length,
        following: author.get('following') || [],
      };
    } catch (error) {
      console.error('Error while fetching author details:', error);
      return null;
    }
  }, [Parse]);

  const fetchPostCount = useCallback(async (authorId) => {
    const Post = Parse.Object.extend('Post');
    const query = new Parse.Query(Post);
    const author = new Parse.User();
    author.id = authorId;
    query.equalTo('author', author);
    try {
      const count = await query.count();
      return count;
    } catch (error) {
      console.error('Error while fetching post count:', error);
      return 0;
    }
  }, [Parse]);

  const handleDelete = async (postId) => {
    const Post = Parse.Object.extend('Post');
    const query = new Parse.Query(Post);
    try {
      const post = await query.get(postId);
      await post.destroy();
      fetchPosts();
    } catch (error) {
      console.error('Error while deleting post:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Error.",
        description: "You need to log in to follow the author.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await addFollower(userId);
      const updatedAuthorDetails = await fetchAuthorDetails(userId);
      setAuthorDetails(updatedAuthorDetails);

      toast({
        title: "Followed.",
        description: "You have followed the author.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error while following author:', error);
      toast({
        title: "Error.",
        description: `There was an error following the author: ${error.message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (currentUser && currentUser.id !== userId) {
      setUserId(currentUser.id);
      fetchPosts();
    }
  }, [currentUser, userId, fetchPosts]);

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [authorData, count] = await Promise.all([
            fetchAuthorDetails(userId),
            fetchPostCount(userId)
          ]);
          setAuthorDetails(authorData);
          setPostCount(count);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [userId, fetchAuthorDetails, fetchPostCount]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!authorDetails) {
    return <Text color="white">Author details not available.</Text>;
  }

  return (
    <Box p={6}>
      <CreatePost />
      <Stack spacing={6}>
        {posts.map(post => (
          <Post key={post.objectId} post={post} onDelete={handleDelete} />
        ))}
      </Stack>
      <Box mt={6}>
        <Button onClick={() => setView('chat')} colorScheme="purple" mr={2}>Chat</Button>
        <Button onClick={() => setView('inbox')} colorScheme="purple">Inbox</Button>
      </Box>
      {view === 'chat' ? <Chat receiverId="RECEIVER_USER_ID" /> : <Inbox />} {/* Replace "RECEIVER_USER_ID" with the actual receiver's user ID */}
      <Box p={4} borderWidth="0.2px" borderRadius="sm" bg="#121212" shadow="sm">
        <Flex align="center" mb={4}>
          <Avatar size="xl" src={authorDetails?.avatar} />
          <Stack ml={4}>
            <Heading as="h2" size="lg" color="white">{authorDetails?.username}</Heading>
            <Text color="white">{authorDetails?.followersCount} Followers</Text>
            <Text color="white">{postCount} Posts</Text>
            <Text color="white">{authorDetails?.bio}</Text>
            <Flex>
              {currentUser && currentUser.id !== userId && (
                <Button colorScheme="purple" onClick={handleFollow} mr={2}>Follow</Button>
              )}
              <Link href={`/chat?receiverId=${userId}`}>
                <Button colorScheme="purple">Message</Button>
              </Link>
            </Flex>
          </Stack>
        </Flex>
        <Heading as="h3" size="md" mb={4} color="white">Author's Posts</Heading>
        <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={8}>
          {posts.map(post => (
            <Post key={post.id} post={{...post, timeDifference: getTimeDifference(post.createdAt)}} onDelete={() => handleDelete(post.id)} currentUser={currentUser} />
          ))}
        </SimpleGrid>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Send a Message</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Input
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="teal" mr={3} onClick={handleSendMessage}>Send</Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
};

const MyApp = ({ Component, pageProps }) => {
  return (
    <ChakraProvider>
      <ParseProvider>
        <ChatProvider>
          <ErrorBoundary>
            <Component {...pageProps} />
          </ErrorBoundary>
        </ChatProvider>
      </ParseProvider>
    </ChakraProvider>
  );
};

export default MyApp;
