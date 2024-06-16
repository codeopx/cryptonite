
import { Html, Head, Main, NextScript } from "next/document";
import {ColorModeScript, extendTheme} from "@chakra-ui/react";

export const theme = extendTheme();

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <ColorModeScript initialColorMode={theme}/>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}