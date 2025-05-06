import React, { useState } from 'react';
import { Box, Button, Input, Textarea, useToast, Icon, VStack, Stack, Spinner, useBreakpointValue, Image } from "@chakra-ui/react";
import { useParse } from '@/context/parseContext';
import { FiImage, FiSend, FiVideo } from 'react-icons/fi';

// import Parse from 'parse/dist/parse';


// const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
// const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

// Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
// Parse.serverURL = "https://parseapi.back4app.com/";

import { keyframes } from '@emotion/react';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [link, setLink] = useState('');
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { Parse, currentUser } = useParse();

  const sanitizeFileName = (fileName) => {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setFilePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
    if (selectedFiles.length > 0) {
      toast({
        title: "Images Selected",
        description: `${selectedFiles.length} images have been selected.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleVideoFileChange = (e) => {
    const selectedVideoFiles = Array.from(e.target.files);
    setVideoFiles((prevVideoFiles) => [...prevVideoFiles, ...selectedVideoFiles]);
    const newVideoPreviews = selectedVideoFiles.map(file => URL.createObjectURL(file));
    setVideoPreviews((prevPreviews) => [...prevPreviews, ...newVideoPreviews]);
    if (selectedVideoFiles.length > 0) {
      toast({
        title: "Videos Selected",
        description: `${selectedVideoFiles.length} videos have been selected.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async () => {
    if (!content && files.length === 0 && !link && videoFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please provide content, images, videos, or a link.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    const uploadedImageUrls = [];
    const uploadedVideoUrls = [];

    try {
      for (const file of files) {
        const sanitizedFileName = sanitizeFileName(file.name);
        const parseFile = new Parse.File(sanitizedFileName, file);
        await parseFile.save();
        uploadedImageUrls.push(parseFile.url());
      }

      for (const videoFile of videoFiles) {
        const sanitizedFileName = sanitizeFileName(videoFile.name);
        const parseVideoFile = new Parse.File(sanitizedFileName, videoFile);
        await parseVideoFile.save();
        uploadedVideoUrls.push(parseVideoFile.url());
      }

      const Post = Parse.Object.extend('Post');
      const post = new Post();

      post.set('content', content);
      if (uploadedImageUrls.length > 0) post.set('imageUrls', uploadedImageUrls);
      if (uploadedVideoUrls.length > 0) post.set('videoUrls', uploadedVideoUrls);
      if (link) post.set('link', link);
      post.set('author', currentUser); // Set the author to the current user

      // Initialize likesCount, viewsCount, and commentsCount
      post.set('likesCount', 0);
      post.set('viewsCount', 0);
      post.set('commentsCount', 0);

      // Set ACL to give the public read and write permissions
      const acl = new Parse.ACL(currentUser);
      acl.setPublicReadAccess(true);
      acl.setPublicWriteAccess(true);
      post.setACL(acl);

      await post.save();
      toast({
        title: "Success",
        description: "Post created successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setContent('');
      setFiles([]);
      setFilePreviews([]);
      setVideoFiles([]);
      setVideoPreviews([]);
      setLink('');

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create post: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  const imageButtonText = useBreakpointValue({ base: "", md: "Image" });
  const videoButtonText = useBreakpointValue({ base: "", md: "Video" });
  const postButtonText = useBreakpointValue({ base: "", md: "Post" });
  const stackDirection = useBreakpointValue({ base: 'row', md: 'row' });

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={6}
      mb={6}
      borderColor="purple.200"
      shadow="sm"
      animation={`${fadeIn} 0.5s ease-in-out`}
      _hover={{ shadow: "md" }}
      bg="#121212"
    >
      <VStack spacing={4}>
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          focusBorderColor="purple.400"
          bg="#121212"
          color="white"
          _placeholder={{ color: 'gray.400' }}
          size="lg"
        />
        <Input
          placeholder="Enter a link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          focusBorderColor="purple.400"
          bg="#121212"
          color="white"
          _placeholder={{ color: 'gray.400' }}
          size="lg"
        />
        <Stack direction={stackDirection} w="full" spacing={4}>
          <Input
            type="file"
            onChange={handleFileChange}
            focusBorderColor="purple.400"
            color="gray.400"
            bg="gray.700"
            multiple
            display="none"
            id="file-input"
          />
          <Input
            type="file"
            accept="video/*"
            onChange={handleVideoFileChange}
            focusBorderColor="purple.400"
            color="gray.400"
            bg="gray.700"
            multiple
            display="none"
            id="video-input"
          />
          <Button
            as="label"
            htmlFor="file-input"
            colorScheme="purple"
            leftIcon={<Icon as={FiImage} />}
            flex="1"
          >
            {imageButtonText}
          </Button>
          <Button
            as="label"
            htmlFor="video-input"
            colorScheme="purple"
            leftIcon={<Icon as={FiVideo} />}
            flex="1"
          >
            {videoButtonText}
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleSubmit}
            leftIcon={<Icon as={FiSend} />}
            flex="1"
            isDisabled={loading}
          >
            {loading ? <Spinner size="sm" /> : postButtonText}
          </Button>
        </Stack>
        <Box w="full">
          <Stack direction="row" wrap="wrap" spacing={2}>
            {filePreviews.map((src, index) => (
              <Image key={index} src={src} alt={`image-${index}`} boxSize="100px" objectFit="cover" />
            ))}
          </Stack>
          <Stack direction="row" wrap="wrap" spacing={2}>
            {videoPreviews.map((src, index) => (
              <video key={index} src={src} alt={`video-${index}`} width="100px" controls />
            ))}
          </Stack>
        </Box>
      </VStack>
    </Box>
  );
};

export default CreatePost;
