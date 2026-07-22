import PopupPage from './pages/popup';
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: { initialColorMode: 'dark', useSystemColorMode: false },
  colors: {
    ctp: {
      crust: '#232634',
      mantle: '#292c3c',
      base: '#303446',
      surface0: '#414559',
      surface1: '#51576d',
      overlay2: '#949cbb',
      subtext0: '#a5adce',
      subtext1: '#b5bfe2',
      text: '#c6d0f5',
      blue: '#8caaee',
      green: '#a6d189',
      red: '#e78284',
    },
  },
  styles: {
    global: {
      body: { background: 'ctp.mantle', color: 'ctp.text' },
      '#root': { background: 'ctp.mantle' },
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
