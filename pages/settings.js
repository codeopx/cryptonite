import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
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
  VStack,
  Avatar,
  Box
} from "@chakra-ui/react";
import { FaCog } from "react-icons/fa";
import { useParse } from "@/context/parseContext";
import Header from "@/components/header";

import Parse from "../parseConfig";


const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;

Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = "https://parseapi.back4app.com/";


export default function Settings() {
  const router = useRouter();
  const { Parse } = useParse();

  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const user = Parse.User.current();
      if (!user) {
        await router.push("/login");
      } else {
        setDescription(user.get("bio"));  // Ensure the field name is "bio"
        setAvatarUrl(user.get("avatarUrl"));
      }
    };

    checkUser().catch(error => {
      console.error("Error checking user:", error);
      router.push("/login");
    });
  }, [router, Parse]);

  const onSave = async () => {
    try {
      const user = Parse.User.current();
      if (user) {
        if (selectedFile) {
          const file = new Parse.File(selectedFile.name, selectedFile);
          await file.save();
          user.set("avatarUrl", file.url());
        }
        user.set("bio", description);  // Ensure the field name is "bio"
        await user.save();
        console.log("Successfully saved settings.");
        setAvatarUrl(user.get("avatarUrl"));  // Update the avatarUrl state
        await router.push("/");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      if (error.code === Parse.Error.SESSION_MISSING) {
        await router.push("/login");
      }
    }
  };

  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const onLogout = async () => {
    try {
      await Parse.User.logOut();
      console.log("Successfully logged out.");
      await router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      await router.push("/login");
    }
  };

  return (
    <Header>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bg="#121212">
        <Card maxW="md" w="full" bg="#121212" color="white" borderRadius="lg" boxShadow="lg" border="2px" borderColor="white" marginBottom="150">
          <CardHeader>
            <HStack>
              <FaCog />
              <Heading as="h2" size="md">Settings</Heading>
            </HStack>
          </CardHeader>
          <CardBody py={0}>
            <VStack spacing="1em">
              <Avatar size="xl" src={avatarUrl} />
              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Input
                  placeholder="Description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  focusBorderColor="purple.400"
                  bg="#4a5568"
                  border="none"
                  _hover={{ bg: "#2d3748" }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Upload Avatar</FormLabel>
                <Input
                  type="file"
                  onChange={onFileChange}
                  focusBorderColor="purple.400"
                  bg="#4a5568"
                  border="none"
                  _hover={{ bg: "#2d3748" }}
                />
              </FormControl>
            </VStack>
          </CardBody>
          <CardFooter display="flex" justifyContent="center">
            <HStack>
              <Button colorScheme="purple" onClick={onLogout}>Log out</Button>
              <Button colorScheme="purple" onClick={onSave}>Save</Button>
            </HStack>
          </CardFooter>
        </Card>
      </Box>
    </Header>
  );
}
