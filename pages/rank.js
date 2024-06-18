import React, { useEffect, useState } from 'react';
import { Box, Text, Avatar, Container, Heading, VStack, Flex, Spinner, keyframes } from "@chakra-ui/react";
import { useParse } from "@/context/parseContext";
import Header from '@/components/header';
import NextLink from 'next/link';
import { FaCrown } from 'react-icons/fa';



import Parse from '../parseConfig';


const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";


const fetchTopUsers = async (Parse) => {
  const userQuery = new Parse.Query(Parse.User);
  let allUsers = [];
  try {
    allUsers = await userQuery.find();
  } catch (error) {
    console.error("Error fetching users:", error);
  }
  
  if (!allUsers) {
    return [];
  }

  const userViews = await Promise.all(allUsers.map(async user => {
    const totalViews = await fetchUserTotalViews(Parse, user.id);
    return { userId: user.id, username: user.get('username'), avatar: user.get('avatarUrl'), totalViews };
  }));
  userViews.sort((a, b) => b.totalViews - a.totalViews);
  return userViews;
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

const RankPage = () => {
  const { Parse } = useParse();
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const usersData = await fetchTopUsers(Parse);
      setTopUsers(usersData);
      setLoading(false);
    };

    fetchData();
  }, [Parse]);

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Container maxW="container.md" py={8} animation={`${fadeIn} 0.5s ease-in-out`} bg="#121212">
      <Heading as="h1" size="xl" mb={8} color="white" textAlign="center">
        Top Users
      </Heading>
      <VStack spacing={4} overflowY="scroll" maxH="70vh" p={4} borderRadius="md" borderWidth="1px" borderColor="purple.300" bg="#121212" css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#121212',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#555',
        },
      }}>
        {topUsers.map((user, index) => (
          <Flex key={user.userId} w="100%" p={4} align="center" borderWidth="1px" borderRadius="md" borderColor="white" bg="#121212" animation={`${fadeIn} 0.5s ease-in-out`}>
            <NextLink href={`/user/${user.userId}`} passHref>
              <Avatar name={user.username} src={user.avatar} size="md" mr={4} />
            </NextLink>
            <Box flex="1" bg="#121212">
              <NextLink href={`/user/${user.userId}`} passHref>
                <Text as="a" fontWeight="bold" color="white" fontSize="lg" _hover={{ textDecoration: "underline" }}>
                  {user.username}
                  {index === 0 && <FaCrown color="gold" style={{ marginLeft: '8px' }} />}
                </Text>
              </NextLink>
              <Text color="gray.400">Total Views: {formatCount(user.totalViews)}</Text>
            </Box>
            <Text fontWeight="bold" color="purple.300" fontSize="lg">{`#${index + 1}`}</Text>
          </Flex>
        ))}
      </VStack>
    </Container>
  );
};

export default RankPage;
