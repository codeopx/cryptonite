import React, { useState, useEffect, useRef } from "react";
import { Box, Flex, Text, Image, IconButton, Stack, Link, keyframes, useDisclosure, Button, Input, Grid, useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { FaHeart, FaRegHeart, FaCommentDots, FaTrashAlt, FaShareAlt, FaEye, FaEllipsisV, FaChartBar } from "react-icons/fa";
import { MdDelete, MdReply } from "react-icons/md";
import NextLink from 'next/link';
import { AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay } from "@chakra-ui/react";
import { useParse } from "@/context/parseContext";
import moment from 'moment';

const Post = ({ post, onDelete, currentUser }) => {
  const { Parse } = useParse();
  const [isDeleting, setIsDeleting] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyComment, setReplyComment] = useState({ id: null, text: "" });
  const [viewsCount, setViewsCount] = useState(post.viewsCount || 0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const {
    isOpen: isCommentsOpen,
    onOpen: onCommentsOpen,
    onClose: onCommentsClose
  } = useDisclosure();

  useEffect(() => {
    const fetchLikesAndComments = async () => {
      try {
        const PostObject = Parse.Object.extend("Post");
        const query = new Parse.Query(PostObject);
        query.equalTo("objectId", post.id);
        const postObject = await query.first();
        if (postObject) {
          const likedBy = postObject.get("likedBy") || [];
          setLikesCount(postObject.get("likesCount") || likedBy.length);
          setIsLiked(currentUser ? likedBy.includes(currentUser.id) : false);
          setComments(postObject.get("comments") || []);
        }
      } catch (error) {
        console.error('Error fetching likes and comments:', error);
      }
    };
    fetchLikesAndComments();
  }, [Parse, post.id, currentUser]);

  const formatNumber = (number) => {
    if (number >= 1000000000) {
      return (number / 1000000000).toFixed(1) + 'B';
    } else if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    } else {
      return number;
    }
  };

  useEffect(() => {
    const fetchViewsCount = async () => {
      try {
        const PostObject = Parse.Object.extend("Post");
        const query = new Parse.Query(PostObject);
        query.equalTo("objectId", post.id);
        const postObject = await query.first();
        if (postObject) {
          setViewsCount(postObject.get("viewsCount"));
        }
      } catch (error) {
        console.error('Error fetching views count:', error);
      }
    };

    const incrementViewsCount = async () => {
      if (currentUser && currentUser.id !== post.author.id) {
        try {
          const PostObject = Parse.Object.extend("Post");
          const query = new Parse.Query(PostObject);
          query.equalTo("objectId", post.id);
          const postObject = await query.first();
          if (postObject) {
            postObject.increment("viewsCount");
            await postObject.save();
            setViewsCount(postObject.get("viewsCount"));
          }
        } catch (error) {
          console.error('Error incrementing views count:', error);
        }
      }
    };

    fetchViewsCount();
    incrementViewsCount();
  }, [Parse, post.id, currentUser, post.author.id]);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(post.id);
      onClose();
    }, 1000); // duration of the dust animation
  };

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      const PostObject = Parse.Object.extend("Post");
      const query = new Parse.Query(PostObject);
      query.equalTo("objectId", post.id);
      const postObject = await query.first();
      if (postObject) {
        const likedBy = postObject.get("likedBy") || [];

        if (isLiked) {
          const index = likedBy.indexOf(currentUser.id);
          if (index > -1) {
            likedBy.splice(index, 1);
          }
          setLikesCount(likesCount - 1);
          setIsLiked(false);
        } else {
          likedBy.push(currentUser.id);
          setLikesCount(likesCount + 1);
          setIsLiked(true);
        }

        postObject.set("likedBy", likedBy);
        postObject.set("likesCount", likedBy.length); // Save the likes count
        await postObject.save();
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Post',
        text: post.content,
        url: shareUrl,
      }).catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that do not support the Web Share API
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard');
      }, (error) => {
        console.error('Error copying link:', error);
      });
    }
  };

  const handleAddComment = async (parentId = null) => {
    if (!currentUser || (!newComment.trim() && !replyComment.text.trim())) return;

    try {
      const PostObject = Parse.Object.extend("Post");
      const query = new Parse.Query(PostObject);
      query.equalTo("objectId", post.id);
      const postObject = await query.first();

      if (postObject) {
        const newCommentObject = {
          id: currentUser.id,
          name: currentUser.get("username"),
          avatar: currentUser.get("avatarUrl"),
          content: parentId ? replyComment.text : newComment,
          replies: [],
          parentId: parentId
        };

        const updatedComments = parentId
          ? comments.map(comment => comment.id === parentId ? { ...comment, replies: [...(comment.replies || []), newCommentObject] } : comment)
          : [...comments, newCommentObject];

        postObject.set("comments", updatedComments);
        postObject.set("commentsCount", updatedComments.length); // Save the comments count
        await postObject.save();

        setComments(updatedComments);
        setNewComment("");
        setReplyComment({ id: null, text: "" });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (commentId, parentId = null) => {
    try {
      const PostObject = Parse.Object.extend("Post");
      const query = new Parse.Query(PostObject);
      query.equalTo("objectId", post.id);
      const postObject = await query.first();

      if (postObject) {
        const updatedComments = parentId
          ? comments.map(comment => comment.id === parentId ? { ...comment, replies: comment.replies.filter(reply => reply.id !== commentId) } : comment)
          : comments.filter(comment => comment.id !== commentId);

        postObject.set("comments", updatedComments);
        await postObject.save();

        setComments(updatedComments);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReplyComment = (commentId) => {
    setReplyComment({ id: commentId, text: "" });
  };

  const countCommentsAndReplies = () => {
    return comments.reduce((acc, comment) => acc + 1 + (comment.replies ? comment.replies.length : 0), 0);
  };

  const fadeIn = keyframes`
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  `;

  const dust = keyframes`
    0% { opacity: 1; transform: scale(1); translateY(0); }
    20% { opacity: 1; transform: scale(0.9) translateY(-10px); }
    100% { opacity: 0; transform: scale (0.5) translateY(-50px) translateX(50px); }
  `;

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

  return (
    <>
      <Box
        borderWidth="0.2px"
        borderRadius="sm"
        overflow="hidden"
        p={4}
        mb={6}
        borderColor="purple.200"
        shadow="sm"
        bg="#121212"
        color="white"
        animation={`${isDeleting ? dust : fadeIn} 0.3s ease-in-out`}
        transition="all 0.3s ease-in-out"
        _hover={{ shadow: "lg" }}
        position="relative"
      >
        {currentUser && currentUser.id === post.author.id && (
          <Box position="absolute" top="4px" right="4px">
            <Menu>
              <MenuButton as={IconButton} icon={<FaEllipsisV />} variant="ghost" color="white" />
              <MenuList bg="black">
                <MenuItem icon={<FaTrashAlt />} onClick={onOpen} color="white" bg="#121212" _hover={{ bg: "gray.700" }}>
                  Delete
                </MenuItem>
                <MenuItem icon={<FaShareAlt />} onClick={handleShare} color="white" bg="#121212" _hover={{ bg: "gray.700" }}>
                  Share
                </MenuItem>
                <MenuItem icon={<FaChartBar />} as={NextLink} href={`/posts/${post.id}?view=analytics`} color="white" bg="#121212" _hover={{ bg: "gray.700" }}>
                  View Analytics
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>
        )}
        <Flex align="center" mb={4}>
          <NextLink href={currentUser && post.author.id === currentUser.id ? '/my-posts' : `/wall/${post.author.id}`} passHref>
            <Link _hover={{ textDecoration: "none" }}>
              {post.author.avatar && (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  borderRadius="full"
                  boxSize="50px"
                  mr={4}
                  borderWidth="2px"
                  borderColor="purple.500"
                />
              )}
            </Link>
          </NextLink>
          <Stack>
            <Text fontWeight="semibold" fontSize="lg" color="white">{post.author.name}</Text>
            <Text fontSize="xs" color="gray.500">{getTimeDifference(post.createdAt)}</Text>
          </Stack>
        </Flex>
        <Text mb={4}>{post.content}</Text>
        {post.link && (
          <Text mb={4}>
            <Link href={post.link} _hover={{ textDecoration: "none" }} color="white" isExternal>
              More
            </Link>
          </Text>
        )}
        {post.imageUrls && post.imageUrls.length === 1 && (
          <Flex justifyContent="center" mb={4}>
            <Image
              src={post.imageUrls[0]}
              alt={`Uploaded Image`}
              maxWidth="100%"
              maxHeight="400px"
              borderRadius="md"
            />
          </Flex>
        )}
        {post.videoUrls && post.videoUrls.length === 1 && (
          <Flex justifyContent="center" mb={4}>
            <video controls style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "md" }}>
              <source src={post.videoUrls[0]} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Flex>
        )}
        {post.imageUrls && post.imageUrls.length > 1 && (
          <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4} mb={4}>
            {post.imageUrls.map((url, index) => (
              <Box key={index} position="relative" overflow="hidden" borderRadius="md">
                <Image
                  src={url}
                  alt={`Uploaded Image ${index}`}
                  width="100%"
                  height="auto"
                  objectFit="cover"
                  transition="transform 0.3s ease"
                  _hover={{ transform: "scale(1.05)" }}
                />
              </Box>
            ))}
          </Grid>
        )}
        {post.videoUrls && post.videoUrls.length > 1 && (
          <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4} mb={4}>
            {post.videoUrls.map((url, index) => (
              <Box key={index} position="relative" overflow="hidden" borderRadius="md">
                <video
                  controls
                  style={{ width: "100%", height: "auto", objectFit: "cover", transition: "transform 0.3s ease" }}
                  _hover={{ transform: "scale(1.05)" }}
                >
                  <source src={url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </Box>
            ))}
          </Grid>
        )}
        <Flex align="center" justify="space-between" color="white">
          <Stack direction="row" spacing={4}>
            <IconButton
              icon={isLiked ? <FaHeart /> : <FaRegHeart />}
              variant="outline"
              colorScheme={isLiked ? "pink" : "pink"}
              aria-label="Like"
              onClick={handleLike}
            />
            <Text>{likesCount}</Text>
            <IconButton
              icon={<FaCommentDots />}
              variant="outline"
              colorScheme="white"
              aria-label="Comment"
              onClick={onCommentsOpen}
            />
            <Text>{countCommentsAndReplies()}</Text>
            <IconButton
              icon={<FaEye />}
              variant="outline"
              colorScheme="white"
              aria-label="Views"
            />
            <Text>{formatNumber(viewsCount)}</Text>
          </Stack>
        </Flex>
      </Box>

      <Modal isOpen={isCommentsOpen} onClose={onCommentsClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="#121212" color="white">
        <ModalHeader>Comments</ModalHeader>
        <ModalCloseButton />
        <ModalBody bg="#121212">
          <Flex mb={4}>
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              mr={2}
              bg="#1a1a1a"
            />
            <Button onClick={() => handleAddComment()} colorScheme="purple">Comment</Button>
          </Flex>
          {comments.map((comment, index) => (
            <Box key={index} mt={4} p={2} bg={useColorModeValue("#1a1a1a", "#1a1a1a")} borderRadius="md" animation={`${fadeIn} 0.5s ease-in-out`}>
              <Flex alignItems="center" justifyContent="space-between">
                <Flex alignItems="center">
                  {comment.avatar && (
                    <Image
                      src={comment.avatar}
                      alt={comment.name}
                      borderRadius="full"
                      boxSize="30px"
                      mr={2}
                    />
                  )}
                  <Box>
                    <Text fontWeight="bold">{comment.name}</Text>
                    <Text>{comment.content}</Text>
                    <Text fontSize="xs" color="gray.500">{getTimeDifference(comment.createdAt)}</Text>
                  </Box>
                </Flex>
                <Flex alignItems="center">
                  <IconButton
                    icon={<MdReply />}
                    variant="ghost"
                    colorScheme="purple"
                    aria-label="Reply to comment"
                    onClick={() => handleReplyComment(comment.id)}
                    mr={2}
                  />
                  {currentUser && currentUser.id === comment.id && (
                    <IconButton
                      icon={<MdDelete />}
                      variant="ghost"
                      colorScheme="red"
                      aria-label="Delete comment"
                      onClick={() => handleDeleteComment(comment.id)}
                    />
                  )}
                </Flex>
              </Flex>
              {comment.replies && comment.replies.map((reply, replyIndex) => (
                <Box key={replyIndex} mt={4} ml={8} p={2} bg={useColorModeValue("#1a1a1a", "#1a1a1a")} borderRadius="md" animation={`${fadeIn} 0.5s ease-in-out`}>
                  <Flex alignItems="center" justifyContent="space-between">
                    <Flex alignItems="center">
                      {reply.avatar && (
                        <Image
                          src={reply.avatar}
                          alt={reply.name}
                          borderRadius="full"
                          boxSize="25px"
                          mr={2}
                        />
                      )}
                      <Box>
                        <Text fontWeight="bold">{reply.name}</Text>
                        <Text>{reply.content}</Text>
                        <Text fontSize="xs" color="white">{getTimeDifference(reply.createdAt)}</Text>
                      </Box>
                    </Flex>
                    {currentUser && currentUser.id === reply.id && (
                      <IconButton
                        icon={<MdDelete />}
                        variant="ghost"
                        colorScheme="red"
                        aria-label="Delete reply"
                        onClick={() => handleDeleteComment(reply.id, comment.id)}
                      />
                    )}
                  </Flex>
                </Box>
              ))}
              {replyComment.id === comment.id && (
                <Box mt={4} ml={8}>
                  <Input
                    placeholder="Add a reply..."
                    value={replyComment.text}
                    onChange={(e) => setReplyComment({ ...replyComment, text: e.target.value })}
                    mb={2}
                    bg="#1a1a1a"
                  />
                  <Button onClick={() => handleAddComment(comment.id)} colorScheme="purple">Reply</Button>
                </Box>
              )}
            </Box>
          ))}
        </ModalBody>
        <ModalFooter>
          {/* Footer buttons can be added here if needed */}
        </ModalFooter>
      </ModalContent>
    </Modal>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Post
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this post? You can't undo this action afterwards.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default Post;
