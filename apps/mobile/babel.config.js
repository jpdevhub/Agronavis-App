module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@app': './app',
            '@components': './components',
            '@features': './features',
            '@store': './store',
            '@services': './services',
            '@hooks': './hooks',
            '@contexts': './contexts',
            '@constants': './constants',
            '@utils': './utils',
            '@types': './types',
            '@assets': './assets',
          },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
