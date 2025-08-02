import { useEffect, useMemo, useRef, useState } from 'react';

import { LIFECYCLE } from '~/literals';
import { getClientRect, getElement, getElementPosition, hasPosition } from '~/modules/dom';

import { GraphicProps, Lifecycle } from '~/types';

const hiddenLifecycles = [
  LIFECYCLE.INIT,
  LIFECYCLE.BEACON,
  LIFECYCLE.COMPLETE,
  LIFECYCLE.ERROR,
] as Lifecycle[];

export default function JoyrideGraphic(props: GraphicProps) {
  const {
    continuous,
    disableOverlay,
    disableScrollParentFix = false,
    graphic,
    lifecycle,
    spotlightPadding = 0,
    styles,
    target,
  } = props;
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [graphicWidth, setGraphicWidth] = useState(0);
  const [graphicHeight, setGraphicHeight] = useState(0);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (graphic.type === 'image' && imageRef.current) {
      setGraphicWidth(imageRef.current.offsetWidth);
      setGraphicHeight(imageRef.current.offsetHeight);
    } else if (graphic.type === 'video' && videoRef.current) {
      setGraphicWidth(videoRef.current.offsetWidth);
      setGraphicHeight(videoRef.current.offsetHeight);
    }
  }, [graphic.type, disableOverlay, continuous, lifecycle]);

  const graphicStyles = useMemo(() => {
    const element = getElement(target);
    const elementRect = getClientRect(element);
    const isFixedTarget = hasPosition(element);
    const top = getElementPosition(element, spotlightPadding, disableScrollParentFix);
    const style = {
      ...styles.graphic,
      position: isFixedTarget ? ('fixed' as const) : ('absolute' as const),
      opacity: 1,
      transition: 'opacity 0.2s',
    };

    const topDesktop = Math.round(top - graphicHeight / 4 - spotlightPadding);
    const topMobile = Math.round(top - graphicHeight);

    if (graphic.position === 'left') {
      const left = Math.round((elementRect?.left ?? 0) - spotlightPadding - graphicWidth);

      if (left < 0) {
        style.left = 0;
        style.top = topMobile;
      } else {
        style.left = left;
        style.top = topDesktop;
      }
    }

    if (graphic.position === 'right') {
      const left = Math.round((elementRect?.right ?? 0) + spotlightPadding);
      const leftBound = screenWidth - graphicWidth;

      if (left > leftBound) {
        style.left = leftBound;
        style.top = topMobile;
      } else {
        style.left = left;
        style.top = topDesktop;
      }
    }

    return style;
  }, [
    disableScrollParentFix,
    graphic,
    graphicHeight,
    graphicWidth,
    screenWidth,
    spotlightPadding,
    styles.graphic,
    target,
  ]);

  if (
    disableOverlay || continuous
      ? hiddenLifecycles.includes(lifecycle)
      : lifecycle !== LIFECYCLE.TOOLTIP
  ) {
    return null;
  }

  if (graphic.type === 'image') {
    // NOTE: alt can be overwritten
    return (
      <div style={graphicStyles}>
        <img ref={imageRef} alt="" {...graphic} />
      </div>
    );
  }

  return (
    <div style={graphicStyles}>
      <video
        ref={videoRef}
        autoPlay
        className={graphic.className}
        disablePictureInPicture
        disableRemotePlayback
        loop
        muted
        playsInline
        {...graphic}
      />
    </div>
  );
}
