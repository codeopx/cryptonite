import React, { useEffect, useState } from 'react';
import { Box, SimpleGrid, useToast, Heading, keyframes, Avatar, Text, Button, Stack, Flex } from "@chakra-ui/react";
import { useParse } from '@/context/parseContext';
import LoadingScene from './LoadingScene';
import Post from '@/components/posts';
import Parse from '../parseConfig';

const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";

const queryUserPosts = async (Parse, userId) => {
  const Post = Parse.Object.extend('Post');
  const query = new Parse.Query(Post);
  const user = new Parse.User();
  user.id = userId;
  query.equalTo('author', user);
  query.descending('createdAt');

  try {
    const posts = await query.find();
    return posts.map(post => ({
      id: post.id,
      content: post.get('content'),
      author: {
        id: post.get('author').id,
        name: post.get('author').get('username'),
        avatar: post.get('author').get('avatarUrl')
      },
      viewsCount: post.get('viewsCount'),
      createdAt: post.get('createdAt')
    }));
  } catch (error) {
    console.error("Error querying user posts:", error);
    return [];
  }
};

const fetchAuthorDetails = async (Parse, userId) => {
  const query = new Parse.Query(Parse.User);
  try {
    const user = await query.get(userId);
    return {
      id: user.id,
      username: user.get('username'),
      avatar: user.get('avatarUrl'),
      bio: user.get('bio'),
      followersCount: user.get('followersCount') || 0
    };
  } catch (error) {
    console.error("Error fetching author details:", error);
    return null;
  }
};

const fetchPostCount = async (Parse, userId) => {
  const Post = Parse.Object.extend('Post');
  const query = new Parse.Query(Post);
  const user = new Parse.User();
  user.id = userId;
  query.equalTo('author', user);

  try {
    const count = await query.count();
    return count;
  } catch (error) {
    console.error("Error fetching post count:", error);
    return 0;
  }
};

const fetchUserRank = async (Parse, userId) => {
  // Implement your logic to fetch user rank
  return { rank: 1, totalViews: 1000 }; // Placeholder
};

const deletePost = async (Parse, postId) => {
  const Post = Parse.Object.extend('Post');
  const query = new Parse.Query(Post);

  try {
    const post = await query.get(postId);
    await post.destroy();
    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
};

const PostsList = ({ searchTerm }) => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [authorDetails, setAuthorDetails] = useState(null);
  const [postCount, setPostCount] = useState(0);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const { Parse, currentUser, addFollower } = useParse();
  const toast = useToast();

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        setLoading(true);
        const [postsData, authorData, count, rankData] = await Promise.all([
          queryUserPosts(Parse, currentUser.id),
          fetchAuthorDetails(Parse, currentUser.id),
          fetchPostCount(Parse, currentUser.id),
          fetchUserRank(Parse, currentUser.id)
        ]);
        setPosts(postsData);
        setFilteredPosts(postsData);
        setAuthorDetails(authorData);
        setPostCount(count);
        setUserRank(rankData);
        setLoading(false);
      }
    };

    fetchData();
  }, [Parse, currentUser]);

  useEffect(() => {
    const currentUser = Parse.User.current();
    if (currentUser && !localStorage.getItem('hasRefreshed')) {
      localStorage.setItem('hasRefreshed', 'true');
      window.location.reload();
    }
  }, [Parse.User]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredPosts(posts);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = posts.filter(post => 
        post.content.toLowerCase().includes(term) ||
        (post.author && post.author.name.toLowerCase().includes(term))
      );
      setFilteredPosts(filtered);
    }
  }, [searchTerm, posts]);

  const handleFollow = async () => {
    if (!currentUser || !authorDetails) return;

    try {
      await addFollower(authorDetails.id);
      setAuthorDetails(prev => ({
        ...prev,
        followersCount: prev.followersCount + 1,
      }));
      toast({
        title: "Followed.",
        description: "You have followed the author.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
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
      setFilteredPosts(filteredPosts.filter(post => post.id !== postId));
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

  if (loading) {
    return <LoadingScene />;
  }

  return (
    <Box p={4} borderWidth="0.2px" borderRadius="sm" bg="#121212" shadow="sm" animation={`${fadeIn} 0.5s ease-in-out`}>
      <Flex align="center" mb={4}>
        <Avatar size="xl" src={authorDetails?.avatar} mr={4} />
        <Stack ml={4}>
          <Heading as="h2" size="lg" color="white">{authorDetails?.username}</Heading>
          <Text color="white">{userRank ? `Rank: ${userRank.rank}` : 'Rank: N/A'}</Text>
          <Text color="white">Total Views: {userRank ? formatCount(userRank.totalViews) : 0}</Text>
          <Text color="white">{postCount} Posts</Text>
          <Text color="white">{authorDetails?.bio}</Text>
        </Stack>
      </Flex>
      <Heading as="h3" size="md" mb={4} color="white">My Posts</Heading>
      <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={8}>
        {filteredPosts.map(post => (
          <Post key={post.id} post={post} onDelete={() => handleDelete(post.id)} currentUser={currentUser} />
        ))}
      </SimpleGrid>
      {filteredPosts.length === 0 && (
        <Text color="white" mt={4} textAlign="center">No posts found.</Text>
      )}
    </Box>
  );
};

export default PostsList;
