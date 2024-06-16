import React from 'react';
import { Box, Spinner, Text } from "@chakra-ui/react";

const LoadingScene = () => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
      <Spinner size="xl"color='purple.600' />
      <Text mt={4} fontSize="lg" color="purple.600">Loading posts...</Text>
    </Box>
  );
};

export default LoadingScene;
