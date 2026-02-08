import React from 'react';
import { Composition } from 'remotion';
import { PLNPromo } from './PLNPromo';

// Root component that exports all compositions
export const Video: React.FC = () => {
  return (
    <>
      {/* Main 60-second promotional video */}
      <Composition
        id="PLNPromo"
        component={PLNPromo}
        durationInFrames={1800} // 60 seconds @ 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};

export default Video;
