import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[(scheme as any) === 'unspecified' ? 'light' : (scheme || 'light') as 'light' | 'dark'];

  const TriggerLabel = (NativeTabs.Trigger as any).Label;
  const TriggerIcon = (NativeTabs.Trigger as any).Icon;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        {TriggerLabel ? <TriggerLabel>Home</TriggerLabel> : null}
        {TriggerIcon ? <TriggerIcon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        /> : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        {TriggerLabel ? <TriggerLabel>Explore</TriggerLabel> : null}
        {TriggerIcon ? <TriggerIcon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        /> : null}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
