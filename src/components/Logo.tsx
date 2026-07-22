import { Image, ImageProps } from '@chakra-ui/react';
import React from 'react';

interface LogoProps {
  logoProps?: ImageProps;
}

const Logo: React.FC<LogoProps> = ({ logoProps }) => {
  return (
    <Image
      src="logo512.png"
      alt="CodeSync"
      {...logoProps}
      maxW="110px"
      borderRadius={'50%'}
      boxShadow={'dark-lg'}
      mb={'0.5rem'}
    />
  );
};
export default Logo;
