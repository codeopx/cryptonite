import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Text,
  Spinner,
  Container,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  useToast,
  Flex,
  Avatar,
  Button
} from "@chakra-ui/react";
import { useParse } from "@/context/parseContext";
import Post from "@/components/posts"; // Adjust the import path as needed
import Header from '@/components/header';

import Parse from 'parse/dist/parse';


const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";


const PostPage = () => {
  const router = useRouter();
  const { postId, view } = router.query;
  const { Parse, currentUser, addFollower } = useParse();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [authorDetails, setAuthorDetails] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      const PostObject = Parse.Object.extend("Post");
      const query = new Parse.Query(PostObject);
      query.include("author");
      query.equalTo("objectId", postId);
      const postObject = await query.first();

      if (postObject) {
        setPost({
          id: postObject.id,
          content: postObject.get("content"),
          imageUrls: postObject.get("imageUrls"),
          videoUrls: postObject.get("videoUrls"),
          link: postObject.get("link"),
          author: {
            id: postObject.get("author").id,
            name: postObject.get("author").get("username"),
            avatar: postObject.get("author").get("avatarUrl"),
          },
          likesCount: postObject.get("likesCount") || 0,
          commentsCount: postObject.get("commentsCount") || 0,
          sharesCount: postObject.get("sharesCount") || 0,
          comments: postObject.get("comments") || [],
          likedBy: postObject.get("likedBy") || [],
        });

        const author = postObject.get("author");
        let followers = author.get('followers');
        if (!Array.isArray(followers)) {
          followers = [];
        }
        setAuthorDetails({
          id: author.id,
          username: author.get('username'),
          avatar: author.get('avatarUrl'),
          followersCount: followers.length,
        });
      }

      setLoading(false);
    };

    const fetchAnalytics = async () => {
      if (!postId) return;

      try {
        const PostObject = Parse.Object.extend('Post');
        const query = new Parse.Query(PostObject);
        query.equalTo('objectId', postId);
        const post = await query.first();

        if (post) {
          const viewsCount = post.get('viewsCount') || 0;
          const likesCount = post.get('likesCount') || 0;
          const commentsCount = post.get('commentsCount') || 0;
          const sharesCount = post.get('sharesCount') || 0;

          setAnalyticsData({
            viewsCount,
            likesCount,
            commentsCount,
            sharesCount,
          });
        } else {
          console.error('Post not found');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const user = await Parse.User.currentAsync();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    if (view === 'analytics') {
      fetchAnalytics();
    } else {
      fetchPost();
      fetchCurrentUser();
    }
  }, [Parse, postId, view]);

  const handleShare = async () => {
    if (!currentUser) return;

    try {
      const PostObject = Parse.Object.extend('Post');
      const query = new Parse.Query(PostObject);
      query.equalTo('objectId', post.id);
      const post = await query.first();

      if (post) {
        post.increment('sharesCount');
        await post.save();
      }

      const postLink = `${window.location.origin}/posts/${post.id}`;
      navigator.clipboard.writeText(postLink);

      toast({
        title: "Post Shared.",
        description: "Post link copied to clipboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: "Error.",
        description: `There was an error sharing the post: ${error.message}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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
      await addFollower(authorDetails.id);

      const updatedAuthorDetails = await fetchAuthorDetails(Parse, authorDetails.id);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bg="#121212" color="white">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (view === 'analytics') {
    if (!analyticsData) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bg="#121212" color="white">
          <Text fontSize="xl" fontWeight="bold" color="red.500">
            Analytics data not found
          </Text>
        </Box>
      );
    }

    return (
      <Header>
        <Container maxW="container.md" py={8} bg="#121212" color="white">
          <Heading as="h1" size="xl" mb={8}>
            Post Analytics
          </Heading>
          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            <Stat>
              <StatLabel>Views</StatLabel>
              <StatNumber color="purple.500">{analyticsData.viewsCount}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Likes</StatLabel>
              <StatNumber color="purple.500">{analyticsData.likesCount}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Comments</StatLabel>
              <StatNumber color="purple.500">{analyticsData.commentsCount}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Shares</StatLabel>
              <StatNumber color="purple.500">{analyticsData.sharesCount}</StatNumber>
            </Stat>
          </Grid>
        </Container>
      </Header>
    );
  }

  if (!post) {
    return (
      <Header>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bg="#121212" color="white">
        <Text fontSize="xl" fontWeight="bold" color="red.500">
          Post not found
        </Text>
      </Box>
      </Header>
    );
  }

  return (
    <Header>
    <Container maxW="container.md" py={8} bg="#121212" color="white">
      <Box mb={4} display="flex" alignItems="center">
        <Avatar src={authorDetails?.avatar} size="md" mr={4} />
        <Box>
          <Text fontWeight="bold" fontSize="lg">{authorDetails?.username}</Text>
      
        </Box>
       
      </Box>
      <Post post={post} currentUser={currentUser} onShare={handleShare} />
    </Container>
    </Header>
  );
};

export default PostPage;
