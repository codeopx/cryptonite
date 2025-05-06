
import Parse from 'parse/dist/parse.min';

const PARSE_APPLICATION_ID = process.env.NEXT_PUBLIC_PARSE_APPLICATION_ID;
const PARSE_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY;
const PARSE_SERVER_URL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

if (!Parse.CoreManager.get('APPLICATION_ID')) {
  Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
  Parse.serverURL = PARSE_SERVER_URL; // Ensure this is correctly set
}

export default Parse;
