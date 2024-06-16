import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Avatar,
  Text,
  Spinner,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { useParse } from "@/context/parseContext";
import Header from '@/components/header';

const fetchRankedUsers = async (Parse) => {
  const query = new Parse.Query(Parse.User);
  query.descending("viewsCount");
  query.limit(10);
  try {
    const results = await query.find();
    return results.map((user) => ({
      id: user.id,
      username: user.get("username"),
      avatar: user.get("avatarUrl"),
      viewsCount: user.get("viewsCount") || 0,
    }));
  } catch (error) {
    console.error("Error fetching ranked users:", error);
    return [];
  }
};

const RankPage = () => {
  const { Parse } = useParse();
  const [rankedUsers, setRankedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const usersData = await fetchRankedUsers(Parse);
      setRankedUsers(usersData);
      setLoading(false);
    };

    fetchData();
  }, [Parse]);

  if (loading) {
    return (
      <Header>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bg="#121212" color="white">
          <Spinner size="xl" />
        </Box>
      </Header>
    );
  }

  return (
    <Header>
      <Container maxW="container.md" py={8} bg="#121212" color="white">
        <Heading as="h1" size="xl" mb={8}>
          Top Users
        </Heading>
        <VStack spacing={6} align="stretch">
          {rankedUsers.map((user, index) => (
            <HStack key={user.id} spacing={4} p={4} borderWidth="1px" borderRadius="md" bg="#2D2D2D">
              <Text fontSize="2xl" color="purple.500" fontWeight="bold">
                #{index + 1}
              </Text>
              <Avatar name={user.username} src={user.avatar} size="lg" />
              <Box>
                <Text fontWeight="bold" fontSize="lg">{user.username}</Text>
                <Text color="gray.400">{user.viewsCount} views</Text>
              </Box>
            </HStack>
          ))}
        </VStack>
      </Container>
    </Header>
  );
};

export default RankPage;
