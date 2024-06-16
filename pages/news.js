import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Heading, Text, VStack, Link, keyframes, Flex, Spinner, Image, SimpleGrid } from "@chakra-ui/react";
import NextLink from "next/link";

const News = ({ isGrid = true }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const cachedNews = localStorage.getItem('news');
        const cachedTime = localStorage.getItem('newsCacheTime');
        const CACHE_DURATION = 600000; // 10 minutes

        const currentTime = Date.now();

        if (cachedNews && cachedTime && (currentTime - cachedTime < CACHE_DURATION)) {
          setNews(JSON.parse(cachedNews));
          setLoading(false);
          return;
        }

        const options = {
          method: 'POST',
          url: 'https://newsnow.p.rapidapi.com/newsv2_top_news_location',
          headers: {
            'x-rapidapi-key': process.env.NEXT_PUBLIC_CRYPTO_NEWS_API_KEY,
            'x-rapidapi-host': 'newsnow.p.rapidapi.com',
            'Content-Type': 'application/json'
          },
          data: {
            location: 'us',
            language: 'en',
            page: 1
          }
        };

        const response = await axios.request(options);
        console.log("API Response:", response.data);

        if (response.data && Array.isArray(response.data.news)) {
          const limitedData = response.data.news.slice(0, 10);
          setNews(limitedData);
          localStorage.setItem('news', JSON.stringify(limitedData));
          localStorage.setItem('newsCacheTime', currentTime.toString());
        } else {
          console.error("Unexpected response data structure:", response.data);
          setNews([]);
        }
      } catch (error) {
        console.error("Error fetching the news data:", error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Text fontSize="lg" color="red.500">Error loading news: {error.message}</Text>
      </Box>
    );
  }

  const Container = isGrid ? SimpleGrid : VStack;
  const containerProps = isGrid ? { columns: { base: 1, md: 2, lg: 3 }, spacing: 4 } : { spacing: 4 };

  return (
    <Box p={4} borderWidth="0.2px" borderRadius="sm" bg="#121212" shadow="sm" animation={`${fadeIn} 0.5s ease-in-out`}>
      <Link as={NextLink} href="/news" _hover={{ textDecoration: "none" }} color="grey">
        <Heading as="h3" size="md" mb={4} color="white">Cryptonite Network News ( CNN )</Heading>
      </Link>
      <Container {...containerProps}>
        {Array.isArray(news) && news.length > 0 ? (
          news.map((article, index) => (
            <Box key={index} w="100%" p={4} borderWidth="1px" borderRadius="lg" bg="#121212" shadow="sm" _hover={{ shadow: "md" }}>
              <Flex justify="center" align="center" mb={2}>
                <Link href={article.url} isExternal color="purple.200" fontWeight="bold" textAlign="left">
                  {article.title}
                </Link>
              </Flex>
              {article.top_image && (
                <Image src={article.top_image} alt={article.title} mb={2} />
              )}
              <Text fontSize="sm" color="white" textAlign="left">{article.short_description || 'No description available'}</Text>
            </Box>
          ))
        ) : (
          <Text fontSize="sm" color="white" textAlign="center">No news articles available.</Text>
        )}
      </Container>
    </Box>
  );
};

export default News;

