import React from 'react'

export const useResponsive = () => {
  const [screenSize, setScreenSize] = React.useState({
    mobile: typeof window !== 'undefined' ? window.innerWidth < 640 : false,
    tablet: typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
    desktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  })

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setScreenSize({
        mobile: width < 640,
        tablet: width < 1024,
        desktop: width >= 1024,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return screenSize
}
