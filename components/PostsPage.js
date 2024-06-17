import React, { useState } from 'react';
import { Box, VStack } from "@chakra-ui/react";
import CreatePost from '../components/createPost'; // Import the CreatePost component
import PostsList from './PostsList'; // Import the PostsList component
import Header from './header';
import Parse from 'parse/dist/parse';


const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";


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
