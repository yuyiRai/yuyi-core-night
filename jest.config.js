const { defaults: tsjPreset, jsWithTs, jsWithBabel } = require('ts-jest/presets');
const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');
// console.error(pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }));

module.exports = {
  "preset": "ts-jest",
  "testEnvironment": "jest-environment-jsdom-fourteen",
  // "collectCoverageFrom": [
  //   "src/**/*.{ts}",
  //   "!src/**/*.d.ts"
  // ],
  "setupFiles": [
    require.resolve("react-app-polyfill/jsdom")
  ],
  "rootDir": process.cwd(),
  "setupFilesAfterEnv": [],
  "modulePaths": [
    'node_modules',
    '<rootDir>/src/'
  ],
  "testMatch": [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}"
  ],
  "testPathIgnorePatterns": [     
    "[/\\\\]node_modules/",
    "<rootDir>/node_modules/"
  ],
  // "extraGlobals": ["React"],
  "transform": {
    '^.+\\.(ts|jsx)$': 'ts-jest',
    "^.+\\.(js|jsx)$": "<rootDir>/config/jest/babelTransform.js",
    "^.+\\.css$": "<rootDir>/config/jest/cssTransform.js",
    "^(?!.*\\.(js|jsx|ts|tsx|css|sass|scss|json)$)": "<rootDir>/config/jest/fileTransform.js"
  },
  "transformIgnorePatterns": [
    "[/\\\\]node_modules/(?!(lodash-es|lodash|rxjs\\_esm5))",
    "^.+\\.module\\.(css|sass|scss)$"
  ],
  "moduleNameMapper": {
    // ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    "@/stores/FormStore":"<rootDir>/src/stores/FormStore",
    '^@/(.*)$': "<rootDir>/src/$1",
    '^src/(.*)$': "<rootDir>/src/$1",
    "^react-native$": "react-native-web",
    "^.+\\.(module\\.|)(css|sass|scss|less)$": "identity-obj-proxy"
  },
  "cacheDirectory": "/jest_tmp/",
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "/test/"
  ],
  "moduleFileExtensions": [
    "js",
    "ts",
    "tsx",
    "json",
    "jsx",
    "node"
  ],
  "watchPlugins": [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname"
  ],
  globals: {
    'ts-jest': {
      compiler: 'ttypescript',
      config: 'tsconfig.json',
      isolatedModules: false
    }
  }
  // "snapshotSerializers": [
  //   "<rootDir>/node_modules/jest-serializer-enzyme",
  //   "<rootDir>/node_modules/jest-serializer-vue"
  // ]
}
