import React from 'react';
import HealthMate, { HealthMateProps } from './HealthMate';

export default function HealthMateMascot(props: HealthMateProps) {
  // Directly forward props to our unified, centrally synced HealthMate 3D component
  return <HealthMate {...props} />;
}
