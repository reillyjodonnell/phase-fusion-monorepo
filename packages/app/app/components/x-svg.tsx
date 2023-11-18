import { Path, Svg } from 'react-native-svg';

// the type are all the props a svg can take
type SvgProps = React.ComponentProps<typeof Svg>;

export default function XSVG(props: SvgProps) {
  return (
    <Svg
      viewBox="0 0 24 24"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </Svg>
  );
}
