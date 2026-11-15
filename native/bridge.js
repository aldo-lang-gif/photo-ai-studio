import { Capacitor, registerPlugin } from '@capacitor/core';
const PhotoAiNative = registerPlugin('PhotoAiNative');
window.PhotoAiNative = PhotoAiNative;
window.photoAiIsNative = Capacitor.isNativePlatform();
