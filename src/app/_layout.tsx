import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function LayoutRaiz() {
  return (
    <>
      <Stack screenOptions={{ headerTitle: 'Biblioteca IPF' }} />
      <StatusBar style="dark" />
    </>
  );
}