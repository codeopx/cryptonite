// components/Layout.js

import { Box, Container, Flex } from "@chakra-ui/react";
import Header from "./header";
import Footer from "./footer";

const Layout = ({ children }) => {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Box as="main" flex="1">
        {children}
      </Box>
      <Footer />
    </Flex>
  );
};

export default Layout;
