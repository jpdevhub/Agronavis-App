// Web mock for react-native-maps — prevents Metro bundler errors on web platform
import React from 'react';
import { View } from 'react-native';

const MapView = ({ children, style }) => <View style={style}>{children}</View>;
const Marker = () => null;
const Polyline = () => null;
const Polygon = () => null;
const Circle = () => null;
const Callout = ({ children }) => <>{children}</>;

MapView.Marker = Marker;

export { Marker, Polyline, Polygon, Circle, Callout };
export default MapView;
