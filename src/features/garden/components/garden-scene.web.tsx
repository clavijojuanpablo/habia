import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { ActivityIndicator, View } from 'react-native';

import type { GardenCanvasProps } from './garden-canvas';

/**
 * On web Skia runs as WebAssembly (public/canvaskit.wasm). WithSkiaWeb downloads it
 * first and only then loads the canvas module, so the rest of the app is not blocked.
 */
export function GardenScene(props: GardenCanvasProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./garden-canvas')}
      componentProps={props}
      fallback={
        <View style={{ width: props.width, height: props.height, justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      }
    />
  );
}
