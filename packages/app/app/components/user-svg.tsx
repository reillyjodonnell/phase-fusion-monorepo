import * as React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export default function UserSVG(props: any) {
  return (
    <Svg
      viewBox="0 0 24 24"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}
