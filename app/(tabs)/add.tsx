import React from 'react';
import { Redirect } from 'expo-router';

export default function AddTab() {
  return <Redirect href="/(tabs)/transactions?openForm=true" />;
}

