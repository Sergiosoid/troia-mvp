import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { TouchableOpacity, Text, Platform, type ComponentProps } from 'react-native';
import { type ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof TouchableOpacity>, 'onPress'>;

export function ExternalLink({ href, children, ...rest }: Props) {
  const handlePress = async () => {
    if (Platform.OS === 'web') {
      // On web, use window.open
      if (typeof window !== 'undefined') {
        window.open(href, '_blank');
      }
    } else {
      // On native, open the link in an in-app browser
      await openBrowserAsync(href, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} {...rest}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </TouchableOpacity>
  );
}
