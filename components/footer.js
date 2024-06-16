import React from "react";
import NextLink from "next/link";
import { Box, Container, Divider, Heading, HStack, Link, Tag, Text, VStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, useDisclosure } from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa";
import { FaDonate } from "react-icons/fa";

export default function Footer() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box py={4} bg="purple.600">
      <Divider my={4}/>
      <Container
        maxW="container.lg"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <VStack alignItems="left" style={{color: "white"}}>
          <Heading size="sm">
            Created by Toby Nosa. (CODEOPX)
          </Heading>
        </VStack>
        <Tag background="#121212" color="white" py={2} onClick={onOpen} cursor="pointer">
          <HStack>
            <FaDonate size="1.5em" />
            <Text>Donate Solana</Text>
          </HStack>
        </Tag>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent style={{backgroundColor: "#121212", color:"white"}}>
          <ModalHeader>Donate Solana</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Solana address: <strong>ExWmNwG2yMEz5VEr5i1EBdKhnmFMzd8gGQPTPCE2kV17</strong></Text>
          </ModalBody>
          <ModalFooter>
            {/* <Button colorScheme="red" mr={3} onClick={onClose}>
              Close
            </Button> */}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
