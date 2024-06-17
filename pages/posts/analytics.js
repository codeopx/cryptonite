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
} from "@chakra-ui/react";
import { useParse } from "@/context/parseContext";
import Header from '@/components/header';

import Parse from 'parse/dist/parse';


const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";


const PostAnalytics = () => {
  const router = useRouter();
  const { postId } = router.query;
  const { Parse } = useParse();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
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

          setAnalyticsData({
            viewsCount,
            likesCount,
            commentsCount,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [Parse, postId]);

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
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Text fontSize="xl" fontWeight="bold" color="red.500">
          Analytics data not found
        </Text>
      </Box>
    );
  }

  return (
    <Header>
    <Container maxW="container.md" py={8}>
      <Heading as="h1" size="xl" mb={8} color="white">
        Post Analytics
      </Heading>
      <Grid templateColumns="repeat(3, 1fr)" gap={6}>
        <Stat>
          <StatLabel color="purple">Views</StatLabel>
          <StatNumber color="white">{formatCount(analyticsData.viewsCount)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel color="purple">Likes</StatLabel>
          <StatNumber color="white">{formatCount(analyticsData.likesCount)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel color="purple">Comments</StatLabel>
          <StatNumber color="white">{formatCount(analyticsData.commentsCount)}</StatNumber>
        </Stat>
      </Grid>
    </Container>
    </Header>
  );
};

export default PostAnalytics;
