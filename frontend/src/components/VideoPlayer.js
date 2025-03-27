import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';

const VideoPlayer = ({ lecture, onProgress }) => {
  const [duration, setDuration] = useState(0);
  const lastTimeRef = useRef(0);
  const accumulatedWatchTimeRef = useRef(0);
  const SKIP_THRESHOLD = 2; // Maximum allowed seconds difference to consider as continuous playback

  const handleProgress = (state) => {
    const { playedSeconds } = state;

    // Calculate the time difference from the last update
    if (lastTimeRef.current) {
      const delta = playedSeconds - lastTimeRef.current;
      // Only accumulate if delta is small (i.e. not a skip)
      if (delta > 0 && delta <= SKIP_THRESHOLD) {
        accumulatedWatchTimeRef.current += delta;
      }
    }
    lastTimeRef.current = playedSeconds;

    // Pass along the playedSeconds, accumulated watch time, and total duration
    onProgress({
      playedSeconds,
      accumulated: accumulatedWatchTimeRef.current,
      duration,
    });
  };

  return (
    <div className="player-wrapper">
      <ReactPlayer
        url={`http://localhost:5001${lecture.video_path}`}
        width="100%"
        height="100%"
        controls
        onProgress={handleProgress}
        onDuration={(d) => setDuration(d)}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
              onContextMenu: (e) => e.preventDefault(),
            },
          },
        }}
        className="react-player"
      />
    </div>
  );
};

export default VideoPlayer;
