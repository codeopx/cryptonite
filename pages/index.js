import React, { useState, useEffect } from "react";
import {
  Alert,
  AlertIcon,
  Card,
  CardBody,
  CardHeader,
  VStack,
  useToast,
  Box,
  Flex,
  keyframes,
  Text,
  Avatar,
  Link,
  Stack
} from "@chakra-ui/react";
import { useParse } from "@/context/parseContext";
import Header from '@/components/header';
import Post from "@/components/posts"; // Adjust the import path as needed
import CreatePost from "@/components/createPost";
import moment from 'moment'; // Make sure to install moment if you haven't
import NextLink from "next/link";
import RankPage from "./rank";

const fetchPosts = async (Parse) => {
  const Post = Parse.Object.extend('Post');
  const query = new Parse.Query(Post);
  query.include('author');
  query.descending('createdAt');
  try {
    const results = await query.find();
    return results.map((post) => ({
      id: post.id,
      content: post.get("content"),
      imageUrls: post.get("imageUrls"),
      videoUrls: post.get("videoUrls"),
      link: post.get("link"),
      author: post.get("author")
        ? {
            id: post.get("author").id,
            name: post.get("author").get("username"),
            avatar: post.get("author").get("avatarUrl"),
          }
        : null,
      likesCount: post.get("likes")?.length || 0,
      commentsCount: post.get("comments")?.length || 0,
      viewsCount: post.get("viewsCount") || 0,
      createdAt: post.get("createdAt"),
    }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
};

const fetchAuthorDetails = async (Parse, authorId) => {
  const query = new Parse.Query(Parse.User);
  try {
    const author = await query.get(authorId);
    return {
      id: author.id,
      username: author.get('username'),
      avatar: author.get('avatarUrl'),
      bio: author.get('bio'),
      followersCount: author.get('followersCount') || 0,
      following: author.get('following') || [],
    };
  } catch (error) {
    console.error('Error while fetching author details:', error);
    return null;
  }
};

const onDeletePost = async (Parse, postId, setPosts) => {
  const Post = Parse.Object.extend("Post");
  const query = new Parse.Query(Post);
  try {
    const post = await query.get(postId);
    await post.destroy();
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  } catch (error) {
    console.error("Error deleting post:", error);
  }
};

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

export default function Home() {
  const { Parse } = useParse();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [searchResults, setSearchResults] = useState({ posts: [], users: [] });
  const [noResults, setNoResults] = useState(false);
  const [authorDetails, setAuthorDetails] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const init = async () => {
      const currentUser = await Parse.User.currentAsync();
      setUser(currentUser);
      const postsData = await fetchPosts(Parse);
      setPosts(postsData);
      if (currentUser) {
        const authorData = await fetchAuthorDetails(Parse, currentUser.id);
        setAuthorDetails(authorData);
      }
    };
    init();
  }, [Parse]);

  useEffect(() => {
    const currentUser = Parse.User.current();
    if (currentUser && !localStorage.getItem('hasRefreshed')) {
      localStorage.setItem('hasRefreshed', 'true');
      window.location.reload();
    }
  }, [user, Parse]);

  const handleSearchResults = (results, noResults) => {
    setSearchResults(results);
    setNoResults(noResults);
  };

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  return (
    <Header onSearchChange={handleSearchResults}>
      <Flex direction={{ base: "column", md: "row" }} spacing={4}>
        <Box flex={2} p={4}>
          {user ? (
            <Card mb={4} bg="#121212" animation={`${fadeIn} 0.5s ease-in-out`}>
              <CardBody>
                <Flex align="center">
                  <Avatar name={user.getUsername()} src={user.get("avatarUrl")} size="md" />
                  <Stack ml={4}>
                    <Text fontWeight="bold" fontSize="30" color="white">Hi, {user.getUsername()}</Text>
                  </Stack>
                </Flex>
              </CardBody>
              <CardHeader>
                <CreatePost onPostCreated={async () => setPosts(await fetchPosts(Parse))} />
              </CardHeader>
            </Card>
          ) : (
            <Alert status="warning" mb={4} justifyContent="center" bg="#121212" animation={`${fadeIn} 0.5s ease-in-out`} color="white">
              <AlertIcon />
              You need to log in to create posts.
            </Alert>
          )}
          {noResults ? (
            <Text color="white" textAlign="center" mt={4}>No results found.</Text>
          ) : (
            <>
              {searchResults.users.length > 0 && (
                <Box mb={4}>
                  <Text color="white" fontWeight="bold">Users</Text>
                  {searchResults.users.map((user) => (
                    <Flex key={user.id} align="center" mb={2}>
                      <NextLink href={`/user/${user.id}`} passHref>
                        <Link _hover={{ textDecoration: "none" }}>
                          <Avatar name={user.username} src={user.avatar} size="md" />
                        </Link>
                      </NextLink>
                      <NextLink href={`/user/${user.id}`} passHref>
                        <Link ml={2} color="purple.300" _hover={{ textDecoration: "none" }}>
                          {user.username}
                        </Link>
                      </NextLink>
                    </Flex>
                  ))}
                </Box>
              )}
              {searchResults.posts.length > 0 && (
                <Box mb={4}>
                  <Text color="white" fontWeight="bold">Posts</Text>
                  {searchResults.posts.map((post) => (
                    <Box key={post.id} mb={4}>
                      <Post post={{ ...post, timeDifference: getTimeDifference(post.createdAt) }} onDelete={() => onDeletePost(Parse, post.id, setPosts)} currentUser={user} />
                    </Box>
                  ))}
                </Box>
              )}
              {searchResults.posts.length === 0 && searchResults.users.length === 0 && posts.map((post) => (
                <Box key={post.id} mb={4}>
                  <Post post={{ ...post, timeDifference: getTimeDifference(post.createdAt) }} onDelete={() => onDeletePost(Parse, post.id, setPosts)} currentUser={user} />
                </Box>
              ))}
            </>
          )}
        </Box>
        <Box flex={1} p={4} borderLeft={{ md: "1px solid", base: "none" }} borderColor="gray.200">
          <VStack spacing={4}>
            <RankPage isGrid={false} />
          </VStack>
        </Box>
      </Flex>
    </Header>
  );
}