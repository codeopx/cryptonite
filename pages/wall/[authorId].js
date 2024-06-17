import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  SimpleGrid,
  useToast,
  Heading,
  keyframes,
  Avatar,
  Text,
  Button,
  Stack,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Link,
} from "@chakra-ui/react";
import { useParse } from '@/context/parseContext';
import LoadingScene from '@/components/LoadingScene';
import Post from '@/components/posts';
import Header from '@/components/header';
import moment from 'moment';

import Parse from 'parse/dist/parse';


const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";


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

const queryPostsByAuthor = async (Parse, authorId) => {
  const Post = Parse.Object.extend('Post');
  const query = new Parse.Query(Post);
  const author = new Parse.User();
  author.id = authorId;
  query.equalTo('author', author);
  query.include('author');
  query.descending('createdAt');
  try {
    const results = await query.find();
    return results.map(result => ({
      id: result.id,
      content: result.get('content'),
      imageUrls: result.get('imageUrls'),
      videoUrls: result.get('videoUrls'),
      link: result.get('link'),
      author: {
        id: result.get('author').id,
        name: result.get('author').get('username'),
        avatar: result.get('author').get('avatarUrl')
      },
      likesCount: result.get('likesCount') || 0,
      commentsCount: result.get('commentsCount') || 0,
      viewsCount: result.get('viewsCount') || 0, // Add viewsCount
      createdAt: result.get('createdAt'),
    }));
  } catch (error) {
    console.error('Error while fetching posts:', error);
    return [];
  }
};

const fetchAuthorDetails = async (Parse, authorId) => {
  const query = new Parse.Query(Parse.User);
  try {
    const author = await query.get(authorId);
    const followers = author.get('followers') || [];
    return {
      id: author.id,
      username: author.get('username'),
      avatar: author.get('avatarUrl'),
      bio: author.get('bio'),
      followersCount: followers.length,
      following: author.get('following') || [],
      followers: followers // Ensure followers is included
    };
  } catch (error) {
    console.error('Error while fetching author details:', error);
    return null;
  }
};

const fetchPostCount = async (Parse, authorId) => {
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
};

const fetchUserTotalViews = async (Parse, userId) => {
  const Post = Parse.Object.extend('Post');
  const query = new Parse.Query(Post);
  const user = new Parse.User();
  user.id = userId;
  query.equalTo('author', user);

  try {
    const posts = await query.find();
    const totalViews = posts.reduce((sum, post) => sum + (post.get('viewsCount') || 0), 0);
    return totalViews;
  } catch (error) {
    console.error("Error fetching user total views:", error);
    return 0;
  }
};

const fetchUserRank = async (Parse, userId) => {
  const userQuery = new Parse.Query(Parse.User);
  const allUsers = await userQuery.find();
  const userViews = await Promise.all(allUsers.map(async user => {
    const totalViews = await fetchUserTotalViews(Parse, user.id);
    return { userId: user.id, totalViews };
  }));
  userViews.sort((a, b) => b.totalViews - a.totalViews);
  const userRank = userViews.findIndex(user => user.userId === userId) + 1;
  const userTotalViews = userViews.find(user => user.userId === userId)?.totalViews || 0;
  return { rank: userRank, totalViews: userTotalViews };
};

const deletePost = async (Parse, postId) => {
  const Post = Parse.Object.extend('Post');
  const query = new Parse.Query(Post);
  try {
    const postToDelete = await query.get(postId);
    await postToDelete.destroy();
    return true;
  } catch (error) {
    console.error('Error while deleting post:', error);
    return false;
  }
};

const AuthorPosts = () => {
  const [posts, setPosts] = useState([]);
  const [authorDetails, setAuthorDetails] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const { Parse, currentUser, addFollower } = useParse();
  const toast = useToast();
  const router = useRouter();
  const { authorId } = router.query;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [messageContent, setMessageContent] = useState('');

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  useEffect(() => {
    if (authorId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [postsData, authorData, count, rankData] = await Promise.all([
            queryPostsByAuthor(Parse, authorId),
            fetchAuthorDetails(Parse, authorId),
            fetchPostCount(Parse, authorId),
            fetchUserRank(Parse, authorId)
          ]);
          setPosts(postsData);
          setAuthorDetails(authorData);
          setPostCount(count);
          setUserRank(rankData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [Parse, authorId]);

  useEffect(() => {
    const currentUser = Parse.User.current();
    if (currentUser && !localStorage.getItem('hasRefreshed')) {
      localStorage.setItem('hasRefreshed', 'true');
      window.location.reload();
    }
  }, [Parse.User]);

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
      await addFollower(authorId);

      const updatedAuthorDetails = await fetchAuthorDetails(Parse, authorId);
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

  const handleDelete = async (postId) => {
    const success = await deletePost(Parse, postId);
    if (success) {
      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Post deleted.",
        description: "The post has been deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error.",
        description: "There was an error deleting the post.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast({
        title: "Message Error.",
        description: "Message content cannot be empty.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Implement your sendMessage logic here
      console.log("Message sent to author:", authorId, "with content:", messageContent);
      setMessageContent('');
      onClose();
      toast({
        title: "Message Sent.",
        description: "Your message has been sent to the author.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error while sending message:', error);
      toast({
        title: "Error.",
        description: `There was an error sending the message: ${error.message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return <LoadingScene />;
  }

  if (!authorDetails) {
    return <Text color="white">Author details not available.</Text>;
  }

  const formatCount = (count) => {
    if (count >= 1000000000) {
      return (count / 1000000000).toFixed(1) + 'B';
    } else if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    } else {
      return count;
    }
  };

  return (
    <Header>
      <Box p={4} borderWidth="0.2px" borderRadius="sm" bg="#121212" shadow="sm" animation={`${fadeIn} 0.5s ease-in-out`}>
        <Flex align="center" mb={4}>
          <Avatar size="xl" src={authorDetails?.avatar} />
          <Stack ml={4}>
            <Heading as="h2" size="lg" color="white">{authorDetails?.username}</Heading>
            <Text color="white">{userRank ? `Rank: ${userRank.rank}` : 'Rank: N/A'}</Text>
            <Text color="white">Total Views: {userRank ? formatCount(userRank.totalViews) : 0}</Text>
            <Text color="white">{postCount} Posts</Text>
            <Text color="white">{authorDetails?.bio}</Text>
            <Flex>
             
              <Link href={`/chat?receiverId=${authorId}`}>
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
              <Button colorScheme="purple" mr={3} onClick={handleSendMessage}>Send</Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Header>
  );
};

export default AuthorPosts;

