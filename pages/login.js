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
import Parse from '../parseConfig'


const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";


export default function Login() {
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
      setError("Please enter both your username and password.");
      return;
    }

    try {
      await Parse.User.logIn(username, password);
      localStorage.setItem('hasRefreshed', 'false'); // Reset the refresh flag
      router.push('/'); // Redirect to the home page
      setTimeout(() => {
        window.location.reload(); // Reload the page after redirection
      }, 500); // Adjust the delay as necessary
      console.log("Successfully logged in.");
    } catch (error) {
      console.error("Login error:", error.message);
      setError(error.message);
    }
  };

  const bg = useColorModeValue('#121212', '#121212');
  const color = useColorModeValue('white', 'white');

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
            <HStack>
              <FaUserPlus size="1.5em" />
              <Heading as="h2" size="lg"> Login</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} alignItems="stretch">
              <FormControl id="username">
                <FormLabel>Username</FormLabel>
                <Input
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  variant="filled"
                  focusBorderColor="purple.400"
                />
              </FormControl>
              <FormControl id="password">
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
          <CardFooter>
            <HStack spacing={4} justifyContent="space-between" w="full">
              <Text fontSize="md">
                Don't have an account?{" "}
                <Link as={NextLink} href="/signup" color="purple.500">Sign Up</Link>
              </Text>
              <Button colorScheme="purple" onClick={onSubmit}>Login</Button>
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
