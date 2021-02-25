module.exports = {
  "plugins": ["@babel/plugin-transform-modules-umd"],
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}]
  ],
};