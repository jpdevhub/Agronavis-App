// Web mock for react-native-maps — prevents Metro bundler errors on web platform
import React from 'react';
import { View } from 'react-native';

const MapView = ({ children, style }) => <View style={style}>{children}</View>;
const Marker = () => null;
const Polyline = () => null;
const Polygon = () => null;
const Circle = () => null;
const Callout = ({ children }) => <>{children}</>;
const UrlTile = () => null;

MapView.Marker = Marker;

// Provider constants (imported by FarmFieldDrawer on Android/iOS path, noops on web)
export const PROVIDER_DEFAULT = null;
export const PROVIDER_GOOGLE = 'google';

export { Marker, Polyline, Polygon, Circle, Callout, UrlTile };
export default MapView;
