// Expo's built-in types (CSS imports, environment variables and more). Expo writes the same
// reference into expo-env.d.ts during local development, but that file is gitignored, so a fresh
// checkout (like CI) doesn't have it. Keeping the reference here makes type checking work everywhere.
/// <reference types="expo/types" />