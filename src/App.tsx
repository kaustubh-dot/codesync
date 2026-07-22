import PopupPage from './pages/popup';
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: { initialColorMode: 'dark', useSystemColorMode: false },
  styles: {
    global: {
      body: { background: '#0b1020', color: 'whiteAlpha.900' },
      '#root': { background: '#0b1020' },
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode="dark" />
      <PopupPage />
    </ChakraProvider>
  );
}

export default App;
