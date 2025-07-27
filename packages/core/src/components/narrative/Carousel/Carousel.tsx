"use client";

import { useState, useEffect, useCallback } from 'react'
import { IconButton, Stack, Paper, Typography, Box } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { OverflowImageCard } from './OverFlowImageCard';
import { CarouselContent } from '../../../types/content';
import { useSafeTheme } from '../../../hooks/useSafeTheme';
import { useBreakpoints } from '../../../hooks/useBreakpoints';


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
    return 4 // for lg and up
  }

  const itemsToShow = Math.min(getItemsToShow(), carouselContent.items.length)
  const itemWidth = `${100 / itemsToShow}%`
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
        // Only auto-advance if no recent manual interaction
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
    // <Paper
    //   elevation={3}
    //   sx={{ 
    //     position: 'relative',
    //     width: '100%',
    //     overflow: 'visible'
    //   }}
    // >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        bgcolor={background}
        height='80%'
        sx={{ padding: 2, overflowY: 'visible'}}
      >
        {scrollAndButtonsEnabled && (
          <IconButton onClick={prev}>
            <ArrowBackIcon />
          </IconButton>
        )}


          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${itemsToShow}, 1fr)`,
              gap: 2,
              width: '100%',
              height: '100%',
              opacity: isTransitioning ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out'
            }}
          >
            {carouselContent.items.slice(currentIndex, currentIndex + itemsToShow).map((item, index) => (
              <OverflowImageCard
                key={`${currentIndex}-${index}-${item.title}`}
                item={item}
                minWidth="100%"
              />
            ))}
          </Box>

        {scrollAndButtonsEnabled && (
          <IconButton onClick={manualNext}>
            <ArrowForwardIcon />
          </IconButton>
        )}
      </Stack>
    // </Paper>
  )
}