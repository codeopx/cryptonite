import React, { useState } from 'react';
import { Box, VStack } from "@chakra-ui/react";
import CreatePost from '../components/createPost'; // Import the CreatePost component
import PostsList from './PostsList'; // Import the PostsList component
import Header from './header';

const PostsPage = () => {
  const [refresh, setRefresh] = useState(false);

  const handlePostCreated = () => {
    setRefresh(prev => !prev);
  };

  return (
    <Header>
    <Box p={6}>
      <VStack spacing={8}>
        <CreatePost onPostCreated={handlePostCreated} />
        <PostsList key={refresh} />
      </VStack>
    </Box>
    </Header>
  );
};

export default PostsPage;
