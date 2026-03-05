"use client";

import React, { useState, useEffect, useCallback } from 'react'
import { OverflowImageCard } from './OverFlowImageCard';
import { CarouselContent } from '@stackwright/types'
import { useSafeTheme } from '../../../hooks/useSafeTheme';
import { useBreakpoints } from '../../../hooks/useBreakpoints';

const ArrowButton = ({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-label={direction === 'left' ? 'Previous' : 'Next'}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      display: 'flex',
      alignItems: 'center',
      color: 'currentColor',
      borderRadius: '50%',
    }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'left'
        ? <polyline points="15 18 9 12 15 6" />
        : <polyline points="9 18 15 12 9 6" />
      }
    </svg>
  </button>
);

export const Carousel = (carouselContent: CarouselContent) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lastInteraction, setLastInteraction] = useState(Date.now())
  const [isTransitioning, setIsTransitioning] = useState(false)
  const safeTheme = useSafeTheme()
  const { isXs, isSmUp, isMdUp, isLgUp } = useBreakpoints()

  const getItemsToShow = () => {
    if (isXs) return 1
    if (isSmUp && !isMdUp) return 2
    if (isMdUp && !isLgUp) return 3
    return 4
  }

  const itemsToShow = Math.min(getItemsToShow(), carouselContent.items.length)
  const scrollAndButtonsEnabled = carouselContent.items.length > itemsToShow

  const next = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(current => {
        if (current >= carouselContent.items.length - itemsToShow) {
          return 0
        }
        return current + 1
      })
      setTimeout(() => setIsTransitioning(false), 50)
    }, 150)
  }, [carouselContent.items.length, itemsToShow])

  const manualNext = () => {
    setLastInteraction(Date.now())
    next()
  }

  const prev = () => {
    setLastInteraction(Date.now())
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(current => {
        if (current <= 0) {
          return carouselContent.items.length - itemsToShow
        }
        return current - 1
      })
      setTimeout(() => setIsTransitioning(false), 50)
    }, 150)
  }

  useEffect(() => {
    if (carouselContent.autoPlay && scrollAndButtonsEnabled) {
      const autoPlaySpeed = carouselContent.autoPlaySpeed || 3000
      const interval = setInterval(() => {
        if (Date.now() - lastInteraction >= autoPlaySpeed) {
          next()
        }
      }, autoPlaySpeed)
      return () => clearInterval(interval)
    }
  }, [carouselContent.autoPlay, carouselContent.autoPlaySpeed, scrollAndButtonsEnabled, itemsToShow, next, lastInteraction])

  useEffect(() => {
    setCurrentIndex(0)
  }, [itemsToShow])

  const background = carouselContent.background || safeTheme.colors.primary;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '16px',
        alignItems: 'center',
        backgroundColor: background,
        height: '80%',
        padding: '16px',
        overflowY: 'visible',
      }}
    >
      {scrollAndButtonsEnabled && (
        <ArrowButton direction="left" onClick={prev} />
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${itemsToShow}, 1fr)`,
          gap: '16px',
          width: '100%',
          height: '100%',
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        {carouselContent.items.slice(currentIndex, currentIndex + itemsToShow).map((item, index) => (
          <OverflowImageCard
            key={`${currentIndex}-${index}-${item.title}`}
            item={item}
            minWidth="100%"
          />
        ))}
      </div>

      {scrollAndButtonsEnabled && (
        <ArrowButton direction="right" onClick={manualNext} />
      )}
    </div>
  )
}