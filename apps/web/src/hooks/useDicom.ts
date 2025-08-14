// apps/web/src/hooks/useDicom.ts
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cornerstoneService, ViewportState, DicomInstance } from '@/services/CornerstoneService'
import { api } from '@/lib/api'

interface UseDicomReturn {
  instance: DicomInstance | null
  imageId: string | null
  isLoading: boolean
  error: Error | null
  loadImage: (instanceId: string) => Promise<void>
  viewport: ViewportState | null
  setViewport: (viewport: Partial<ViewportState>) => void
  resetViewport: () => void
  fitToWindow: () => void
}

export function useDicom(element: HTMLDivElement | null): UseDicomReturn {
  const [imageId, setImageId] = useState<string | null>(null)
  const [instance, setInstance] = useState<DicomInstance | null>(null)
  const [viewport, setViewportState] = useState<ViewportState | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialize Cornerstone
  useEffect(() => {
    cornerstoneService.initialize().catch(setError)
  }, [])
  
  // Enable element when available
  useEffect(() => {
    if (!element) return
    
    try {
      cornerstoneService.enableElement(element)
      
      // Listen to viewport changes
      const onViewportChanged = () => {
        const newViewport = cornerstoneService.getViewport(element)
        setViewportState(newViewport)
      }
      
      element.addEventListener('cornerstoneimagerendered', onViewportChanged)
      element.addEventListener('cornerstoneviewportchanged', onViewportChanged)
      
      return () => {
        element.removeEventListener('cornerstoneimagerendered', onViewportChanged)
        element.removeEventListener('cornerstoneviewportchanged', onViewportChanged)
        cornerstoneService.disableElement(element)
      }
    } catch (err) {
      setError(err as Error)
    }
  }, [element])
  
  const loadImage = useCallback(async (instanceId: string) => {
    if (!element) {
      throw new Error('Cornerstone element not ready')
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Get instance metadata
      const response = await api.get(`/dicom/${instanceId}/meta`)
      const instanceData = response.data
      setInstance(instanceData)
      
      // Load DICOM image
      const newImageId = await cornerstoneService.loadDicomImage(instanceId)
      setImageId(newImageId)
      
      // Display image
      await cornerstoneService.displayImage(element, newImageId)
      
      // Get initial viewport
      const initialViewport = cornerstoneService.getViewport(element)
      setViewportState(initialViewport)
      
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [element])
  
  const setViewport = useCallback((newViewport: Partial<ViewportState>) => {
    if (!element) return
    
    try {
      cornerstoneService.setViewport(element, newViewport)
      const updatedViewport = cornerstoneService.getViewport(element)
      setViewportState(updatedViewport)
    } catch (err) {
      setError(err as Error)
    }
  }, [element])
  
  const resetViewport = useCallback(() => {
    if (!element) return
    
    try {
      cornerstoneService.resetViewport(element)
      const resetViewport = cornerstoneService.getViewport(element)
      setViewportState(resetViewport)
    } catch (err) {
      setError(err as Error)
    }
  }, [element])
  
  const fitToWindow = useCallback(() => {
    if (!element) return
    
    try {
      cornerstoneService.fitToWindow(element)
      const fittedViewport = cornerstoneService.getViewport(element)
      setViewportState(fittedViewport)
    } catch (err) {
      setError(err as Error)
    }
  }, [element])
  
  return {
    instance,
    imageId,
    isLoading,
    error,
    loadImage,
    viewport,
    setViewport,
    resetViewport,
    fitToWindow
  }
}