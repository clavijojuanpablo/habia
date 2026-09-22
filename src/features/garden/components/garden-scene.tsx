import GardenCanvas, { type GardenCanvasProps } from './garden-canvas';

/** On iOS/Android Skia is native code bundled with the app: render directly. */
export function GardenScene(props: GardenCanvasProps) {
  return <GardenCanvas {...props} />;
}
