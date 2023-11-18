import { Path, Polyline, Svg } from 'react-native-svg';

// the type are all the props a svg can take
type SvgProps = React.ComponentProps<typeof Svg>;

export default function CheckSVG(props: SvgProps) {
  return (
    <Svg
      viewBox="0 0 24 24"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}
