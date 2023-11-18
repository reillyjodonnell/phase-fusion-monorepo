import { Path, Polyline, Svg } from 'react-native-svg';

// the type are all the props a svg can take
type SvgProps = React.ComponentProps<typeof Svg>;

export default function SendSVG(props: SvgProps) {
  return (
    <Svg
      viewBox="0 0 24 24"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      <Polyline points="15 17 20 12 15 7" />
      <Path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </Svg>
  );
}
