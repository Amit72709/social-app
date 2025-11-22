
import React, { useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

const MediaItem = ({ url }) => {
  const fullUrl = `http://localhost:5000${url}`;
  const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(fullUrl);
  const videoRef = useRef(null);  // <-- ADD: Ref to video element
  const [inView, setInView] = React.useState(false);  // Local state for control

  const { ref } = useInView({
    threshold: 0.5,  // <-- 50% visible to trigger
    triggerOnce: false,  // Re-check on every scroll
    delay: 100,  // Debounce rapid scrolls
    onChange: (visible) => setInView(visible),  // <-- ADD: Update state on change
  });

  // <-- ADD: Dynamic play/pause on inView change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (inView) {
      video.play().catch((e) => console.warn('Play interrupted (normal):', e));  // Auto-play (muted)
    } else {
      video.pause();  // Pause when out of view
    }
  }, [inView]);  // Re-run when inView toggles

  if (!isVideo) {
    return (
      <img
        src={fullUrl}
        alt="Post media"
        style={{ maxWidth: '100%', height: 'auto', marginBottom: '10px' }}
        onError={(e) => console.error('Image load failed:', fullUrl)}
      />
    );
  }

  return (
    <div ref={ref} style={{ marginBottom: '10px' }}>
      <video
        ref={videoRef}  // <-- ATTACH REF
        src={fullUrl}
        muted  // Required for auto-play
        playsInline
        controls
        preload="metadata"
        loop={false}
        style={{
          width: '100%',
          height: '200px',
          objectFit: 'cover',
          backgroundColor: 'black',
        }}
        onLoadedMetadata={() => console.log('Video loaded:', fullUrl)}
        onPlay={() => console.log('Video playing (50% in view)')}
        onPause={() => console.log('Video paused (scrolled out)')}
        onError={(e) => console.error('Video error:', e.target.error, 'URL:', fullUrl)}
      />
    </div>
  );
};

export default MediaItem;