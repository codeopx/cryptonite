import {
  Box,
  Container,
  Divider,
  Flex,
  Heading,
  Link,
  Stack,
  IconButton,
  useDisclosure,
  Avatar,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Icon,
  VStack,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Image
} from "@chakra-ui/react";
import { FiMenu, FiX, FiSearch } from 'react-icons/fi';
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { useParse } from "@/context/parseContext";
import { keyframes } from '@emotion/react';
import Footer from './footer';

export default function Header({ children, onSearchChange }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { Parse } = useParse();
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true); // New state for user loading
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (Parse) {
      const currentUser = Parse.User.current();
      setUser(currentUser);
      setUserLoading(false); // Set loading to false when user data is ready
    }
  }, [Parse]);

  const handleRouteChange = (url) => {
    if (url === '/wall') {
      router.reload();
    }
  };

  useEffect(() => {
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      if (onSearchChange) {
        onSearchChange([], false);
      }
      return;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // Search for posts
    const postQuery = new Parse.Query("Post");
    postQuery.matches("content", lowerCaseSearchTerm, "i"); // case insensitive search

    // Search for users
    const userQuery = new Parse.Query(Parse.User);
    userQuery.matches("username", lowerCaseSearchTerm, "i"); // case insensitive search

    const [postResults, userResults] = await Promise.all([postQuery.find(), userQuery.find()]);

    const postSearchResults = postResults.map((post) => ({
      id: post.id,
      content: post.get("content"),
      imageUrls: post.get("imageUrls"),
      videoUrls: post.get("videoUrls"),
      link: post.get("link"),
      author: {
        id: post.get("author").id,
        name: post.get("author").get("username"),
        avatar: post.get("author").get("avatarUrl"),
      },
      likesCount: post.get("likesCount") || 0,
      commentsCount: post.get("commentsCount") || 0,
      createdAt: post.get("createdAt"),
    }));

    const userSearchResults = userResults.map((user) => ({
      id: user.id,
      username: user.get("username"),
      avatar: user.get("avatarUrl"),
    }));

    setSearchResults({ posts: postSearchResults, users: userSearchResults });
    if (onSearchChange) {
      onSearchChange({ posts: postSearchResults, users: userSearchResults }, postSearchResults.length === 0 && userSearchResults.length === 0);
    }
  };

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  // Function to handle inbox link click
  const handleInboxClick = () => {
    if (!userLoading) { // Only navigate if user data is ready
      router.push('/inbox');
    }
  };

  return (
    <Flex direction="column" minH="100vh" style={{ backgroundColor: "#121212" }}>
      <Box as="header" bg="purple.600" color="white" position="relative">
        <Container maxW="container.xl">
          <Flex align="center" justify="space-between" py={4} animation={`${fadeIn} 0.5s ease-in-out`}>
            <Flex align="center" flex="1">
            <Image src="/clogo2.png" alt="Logo" boxSize="60px" mr={2} />
              <Heading as="h1" size="lg" letterSpacing={"tighter"} mr={8}>
                <Link as={NextLink} href="/" _hover={{ textDecoration: "none" }}>
                  Cryptonite Network
                </Link>
              </Heading>
              <Flex display={{ base: "none", md: "flex" }} flex="1" maxW="500px">
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="white" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search crypto news, topics..."
                    bg="purple.500"
                    border="none"
                    borderRadius="md"
                    _placeholder={{ color: "whiteAlpha.800" }}
                    focusBorderColor="white"
                    color="white"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Search"
                      icon={<FiSearch />}
                      colorScheme="purple"
                      onClick={handleSearch}
                      bg="purple.700"
                      _hover={{ bg: "purple.600" }}
                    />
                  </InputRightElement>
                </InputGroup>
              </Flex>
            </Flex>

            <Flex align="center">
              <Menu isOpen={isOpen} onClose={onClose} bg="#121212">
                <MenuButton
                  as={IconButton}
                  icon={isOpen ? <FiX /> : <FiMenu />}
                  aria-label="Options"
                  variant="outline"
                  color="white"
                  display={{ base: "block", md: "none" }}
                  onClick={isOpen ? onClose : onOpen}
                  bg="purple.500"
                />
                <MenuList bg="#121212" border="none">
                  <MenuItem onClick={() => { onClose(); router.push('/wall'); }} bg="#121212">
                    <Link as={NextLink} href="/wall" _hover={{ textDecoration: "none", color: "white" }}>
                      My Wall
                    </Link>
                  </MenuItem>
                  <MenuItem onClick={() => { onClose(); router.push('/news'); }} bg="#121212">
                    <Link as={NextLink} href="/news" _hover={{ textDecoration: "none", color: "white" }}>
                      News
                    </Link>
                  </MenuItem>
                  <MenuItem onClick={() => { onClose(); handleInboxClick(); }} bg="#121212">
                    <Link as={NextLink} href="/inbox" _hover={{ textDecoration: "none", color: "white" }}>
                      Inbox
                    </Link>
                  </MenuItem>
                  <MenuItem onClick={() => { onClose(); router.push('/rank'); }} bg="#121212" >
                    <Link as={NextLink} href="/rank" _hover={{ textDecoration: "none", color: "white" }}>
                      Top Users
                    </Link>
                  </MenuItem>
                  {user ? (
                    <>
                      <MenuItem onClick={onClose} bg="#121212">
                        <Link as={NextLink} href="/settings" _hover={{ textDecoration: "none", color: "white" }}>
                          Settings
                        </Link>
                      </MenuItem>
                      <MenuItem onClick={async () => {
                        await Parse.User.logOut();
                        setUser(null);
                        onClose();
                        router.push("/login");
                        bg="#121212"
                      }}>
                        Log Out
                      </MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem onClick={onClose} bg="#121212">
                        <Link as={NextLink} href="/login" _hover={{ textDecoration: "none", color: "white" }}>
                          Log In
                        </Link>
                      </MenuItem>
                      <MenuItem onClick={onClose} bg="#121212">
                        <Link as={NextLink} href="/signup" _hover={{ textDecoration: "none", color: "white" }}>
                          Sign Up
                        </Link>
                      </MenuItem>
                    </>
                  )}
                </MenuList>
              </Menu>

              <Flex display={{ base: "none", md: "flex" }} align="center">
                <Stack direction="row" spacing={6} align="center">
                  <Heading size="md">
                    <Link as={NextLink} href="/wall" _hover={{ textDecoration: "none" }}>
                      My Wall
                    </Link>
                  </Heading>
                  <Heading size="md">
                    <Link as={NextLink} href="/news" _hover={{ textDecoration: "none" }}>
                      News
                    </Link>
                  </Heading>
                  <Heading size="md">
                    <Link as={NextLink} href="/inbox" _hover={{ textDecoration: "none" }} onClick={handleInboxClick}>
                      Inbox
                    </Link>
                  </Heading>
                  <Heading size="md">
                    <Link as={NextLink} href="/rank" _hover={{ textDecoration: "none" }}>
                      Top Users
                    </Link>
                  </Heading>
                  {user ? (
                    <HStack spacing={4}>
                      <Avatar name={user.get('username')} src={user.get('avatarUrl')} size="md" />
                      <Heading size="md">
                        <Link as={NextLink} href="/settings" _hover={{ textDecoration: "none" }}>
                          {user.get('username')}
                        </Link>
                      </Heading>
                    </HStack>
                  ) : (
                    <Stack direction="row" spacing={6}>
                      <Heading size="md">
                        <Link as={NextLink} href="/login" _hover={{ textDecoration: "none" }}>
                          Log In
                        </Link>
                      </Heading>
                      <Heading size="md">
                        <Link as={NextLink} href="/signup" _hover={{ textDecoration: "none" }}>
                          Sign Up
                        </Link>
                      </Heading>
                    </Stack>
                  )}
                </Stack>
              </Flex>
            </Flex>
          </Flex>
          <Flex display={{ base: "flex", md: "none" }} width="100%" maxW="600px" mb={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="white" />
              </InputLeftElement>
              <Input
                placeholder="Search crypto news, topics..."
                bg="purple.500"
                border="none"
                borderRadius="md"
                _placeholder={{ color: "whiteAlpha.800" }}
                focusBorderColor="white"
                color="white"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <InputRightElement>
                <IconButton
                  aria-label="Search"
                  icon={<FiSearch />}
                  colorScheme="purple"
                  onClick={handleSearch}
                  bg="purple.700"
                  _hover={{ bg: "purple.600" }}
                />
              </InputRightElement>
            </InputGroup>
          </Flex>
          <Divider my={4} colorScheme="purple" />
        </Container>
      </Box>
      <Box flex="1">
        <Container maxW="container.xl">
          {children}
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
}
