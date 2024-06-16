import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  Text,
  VStack,
  useColorModeValue,
  ScaleFade,
  Alert,
  AlertIcon,
  keyframes
} from "@chakra-ui/react";
import { FaUserPlus } from "react-icons/fa";
import Header from "@/components/header";
import { useParse } from "@/context/parseContext";

export default function SignUp() {
  const router = useRouter();
  const { Parse } = useParse();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Redirect the user if already logged in
  useEffect(() => {
    (async () => {
      try {
        if (Parse && Parse.User && Parse.User.current() !== null) {
          await router.push("/");
        }
      } catch (err) {
        console.error("Error checking current user:", err);
      }
    })();
  }, [router, Parse]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill out all the fields.");
      return;
    }

    try {
      const user = new Parse.User();
      user.set("username", username);
      user.set("password", password);
      await user.signUp();

      // Log out the user immediately after signup
      await Parse.User.logOut();

      // Redirect to login page after signup
      router.push("/login");
      console.log("Successfully signed up and logged out.");
    } catch (error) {
      console.error("Signup error:", error.message);
      setError(error.message);
    }
  };

  const bg = useColorModeValue("#121212", "#121212");
  const color = useColorModeValue("white", "white");

  // Keyframe animations
  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  return (
    <Header>
      <ScaleFade in={true} initialScale={0.9}>
        <Card bg={bg} color={color} boxShadow="2xl" p="5" rounded="md">
          <CardHeader>
            <HStack spacing={30}>
              <FaUserPlus size="1.5em" />
              <Heading as="h2" size="lg">Sign Up</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} alignItems="stretch">
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  variant="filled"
                  focusBorderColor="purple.400"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  variant="filled"
                  focusBorderColor="purple.400"
                />
              </FormControl>
              {error && (
                <Text color="red.500">{error}</Text>
              )}
            </VStack>
          </CardBody>
          <CardFooter mt={4}>
            <HStack justify="space-between" align="center" w="full">
              <Text fontSize="md">
                Already have an account?{" "}
                <Link as={NextLink} href="/login" color="purple.500">
                  Log in
                </Link>
              </Text>
              <Button colorScheme="purple" onClick={onSubmit}>Sign Up</Button>
            </HStack>
          </CardFooter>
          <Alert status="warning" mb={4} justifyContent="center" bg="#121212" animation={`${fadeIn} 0.5s ease-in-out`} color="white">
            <AlertIcon />
            Forgot Password Not Available On Beta Version.
          </Alert>
        </Card>
      </ScaleFade>
    </Header>
  );
}
