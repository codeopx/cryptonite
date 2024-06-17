import React, { useEffect, useState, useCallback } from 'react';
import { Box, SimpleGrid, useToast, Heading, keyframes } from "@chakra-ui/react";
import { useParse } from '@/context/parseContext';
import LoadingScene from '@/components/LoadingScene'; // Ensure the correct path to your LoadingScene component
import Post from '@/components/posts'; // Ensure the correct path to your Post component
import Header from '@/components/header'; // Ensure the correct path to your Header component
import moment from 'moment'; // Make sure to install moment if you haven't

const queryUserPosts = async (Parse, userId) => {
  const Post = Parse.Object.extend('Post');
  const query = new Parse.Query(Post);
  const user = new Parse.User();
  user.id = userId;
  query.equalTo('author', user);
  query.include('author');
  query.descending('createdAt'); // Order by creation date descending
  try {
    const results = await query.find();
    return results.map(result => ({
      id: result.id,
      content: result.get('content'),
      imageUrls: result.get('imageUrls'), // Ensure imageUrls is used instead of imageUrl
      videoUrls: result.get('videoUrls'), // Ensure videoUrls is used instead of videoUrl
      link: result.get('link'),
      author: {
        id: result.get('author').id,
        name: result.get('author').get('username'),
        avatar: result.get('author').get('avatarUrl') // Adjust this line if necessary
      },
      likesCount: result.get('likesCount') || 0,
      commentsCount: result.get('commentsCount') || 0,
      createdAt: result.get('createdAt'),
    }));
  } catch (error) {
    console.error('Error while fetching posts:', error);
    return [];
  }
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

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { Parse, currentUser } = useParse(); // Assume useParse provides currentUser
  const toast = useToast();

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  const fetchPosts = useCallback(async () => {
    if (currentUser) {
      setLoading(true);
      const postsData = await queryUserPosts(Parse, currentUser.id);
      setPosts(postsData);
      setLoading(false);
    }
  }, [Parse, currentUser]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const currentUser = Parse.User.current();
    if (currentUser && !localStorage.getItem('hasRefreshed')) {
      // User has just logged in and page hasn't been refreshed yet in this session
      localStorage.setItem('hasRefreshed', 'true');
      window.location.reload();
    }
  }, [Parse.User]);

  const getTimeDifference = (timestamp) => {
    const now = moment();
    const postTime = moment(timestamp);
    const diffInSeconds = now.diff(postTime, 'seconds');
    const diffInMinutes = now.diff(postTime, 'minutes');
    const diffInHours = now.diff(postTime, 'hours');
    const diffInDays = now.diff(postTime, 'days');
    const diffInWeeks = now.diff(postTime, 'weeks');
    const diffInMonths = now.diff(postTime, 'months');
    const diffInYears = now.diff(postTime, 'years');

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
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

  if (loading) {
    return <LoadingScene />; // Show loading scene while posts are loading
  }

  return (
    <Header>
      <Box p={4} borderWidth="0.2px" borderRadius="sm" bg="#121212" shadow="sm" animation={`${fadeIn} 0.5s ease-in-out`}>
        <Heading as="h3" size="md" mb={4} color="white">My Posts</Heading>
        <SimpleGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing={8}>
          {posts.map(post => (
            <Post key={post.id} post={{...post, timeDifference: getTimeDifference(post.createdAt)}} onDelete={() => handleDelete(post.id)} currentUser={currentUser} />
          ))}
        </SimpleGrid>
      </Box>
    </Header>
  );
};

export default MyPosts;
