import React, { useEffect, useState, useCallback } from 'react';
import { Box, SimpleGrid, useToast, Heading, keyframes, Avatar, Text, Button, Stack, Flex } from "@chakra-ui/react";
import { useParse } from '@/context/parseContext';
import LoadingScene from './LoadingScene';
import Post from '@/components/posts';

const queryUserPosts = async (Parse, userId) => {
  const Post = Parse.Object.extend('Post');
  const query = new Parse.Query(Post);
  const user = new Parse.User();
  user.id = userId;
  query.equalTo('author', user);
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
      viewsCount: result.get('viewsCount') || 0,
      createdAt: result.get('createdAt'),
    }));
  } catch (error) {
    console.error('Error while fetching posts:', error);
    return [];
  }
};

const fetchAuthorDetails = async (Parse, userId) => {
  const query = new Parse.Query(Parse.User);
  try {
    const user = await query.get(userId);
    const followers = user.get('followers') || [];
    return {
      id: user.id,
      username: user.get('username'),
      avatar: user.get('avatarUrl'),
      bio: user.get('bio'),
      followersCount: followers.length,
      following: user.get('following') || [],
    };
  } catch (error) {
    console.error('Error while fetching user details:', error);
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
    const post = await query.get(postId);
    await post.destroy();
    return true;
  } catch (error) {
    console.error('Error while deleting post:', error);
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

  const fetchData = useCallback(async () => {
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
  }, [Parse, currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
