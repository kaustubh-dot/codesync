import './App.css';
import PopupPage from './pages/popup';
import { ChakraProvider } from '@chakra-ui/react';

function App() {
  return (
    <ChakraProvider>
      <PopupPage />
    </ChakraProvider>
  );
}

export default App;
