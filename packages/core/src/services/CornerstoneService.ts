// packages/core/src/services/CornerstoneService.ts
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import cornerstoneWebImageLoader from 'cornerstone-web-image-loader'
import dicomParser from 'dicom-parser'
import Hammer from 'hammerjs'

export interface ViewportState {
  scale: number
  translation: { x: number; y: number }
  voi: {
    windowWidth: number
    windowCenter: number
  }
  invert: boolean
  rotation: number
  hflip: boolean
  vflip: boolean
}

export interface DicomInstance {
  id: string
  sop_uid: string
  study_uid: string
  frame_count: number
  meta: any
}

export class CornerstoneService {
  private initialized = false
  
  public async initialize(): Promise<void> {
    if (this.initialized) return
    
    try {
      // Configure WADO Image Loader
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser
      
      // Configure Web Image Loader  
      cornerstoneWebImageLoader.external.cornerstone = cornerstone
      
      // Configure cornerstone tools
      cornerstoneTools.external.cornerstone = cornerstone
      cornerstoneTools.external.Hammer = Hammer
      cornerstoneTools.external.cornerstoneMath = cornerstoneTools.external.cornerstoneMath
      
      // Initialize tools
      cornerstoneTools.init()
      
      // Configure WADO Image Loader
      const config = {
        maxWebWorkers: navigator.hardwareConcurrency || 1,
        startWebWorkersOnDemand: false,
        taskConfiguration: {
          decodeTask: {
            initializeCodecsOnStartup: false,
            strict: false
          }
        }
      }
      
      cornerstoneWADOImageLoader.webWorkerManager.initialize(config)
      
      this.initialized = true
      console.log('Cornerstone initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Cornerstone:', error)
      throw error
    }
  }
  
  public async loadDicomImage(instanceId: string): Promise<string> {
    const imageId = `wadouri:/api/v1/dicom/${instanceId}/p10`
    
    // Preload the image
    try {
      await cornerstone.loadImage(imageId)
      return imageId
    } catch (error) {
      console.error('Failed to load DICOM image:', error)
      throw new Error(`DICOM yüklenemedi: ${error}`)
    }
  }
  
  public enableElement(element: HTMLDivElement): void {
    if (!this.initialized) {
      throw new Error('Cornerstone not initialized')
    }
    
    try {
      cornerstone.enable(element)
      
      // Enable tools
      const WwwcTool = cornerstoneTools.WwwcTool
      const PanTool = cornerstoneTools.PanTool  
      const ZoomTool = cornerstoneTools.ZoomTool
      const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool
      
      // Add tools
      cornerstoneTools.addTool(WwwcTool)
      cornerstoneTools.addTool(PanTool)
      cornerstoneTools.addTool(ZoomTool)
      cornerstoneTools.addTool(StackScrollMouseWheelTool)
      
      // Set initial tool states
      cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 }) // Left click
      cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 4 })  // Middle click
      cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 2 }) // Right click
      cornerstoneTools.setToolActive('StackScrollMouseWheel', {})   // Wheel
      
    } catch (error) {
      console.error('Failed to enable cornerstone element:', error)
      throw error
    }
  }
  
  public disableElement(element: HTMLDivElement): void {
    try {
      if (cornerstone.getEnabledElement(element)) {
        cornerstoneTools.removeToolState(element)
        cornerstone.disable(element)
      }
    } catch (error) {
      console.warn('Error disabling cornerstone element:', error)
    }
  }
  
  public async displayImage(element: HTMLDivElement, imageId: string): Promise<void> {
    try {
      const image = await cornerstone.loadImage(imageId)
      cornerstone.displayImage(element, image)
      
      // Fit image to window initially
      cornerstone.fitToWindow(element)
      
    } catch (error) {
      console.error('Failed to display image:', error)
      throw error
    }
  }
  
  public getViewport(element: HTMLDivElement): ViewportState | null {
    try {
      const enabledElement = cornerstone.getEnabledElement(element)
      if (!enabledElement) return null
      
      const viewport = cornerstone.getViewport(element)
      return {
        scale: viewport.scale,
        translation: {
          x: viewport.translation.x,
          y: viewport.translation.y
        },
        voi: {
          windowWidth: viewport.voi.windowWidth,
          windowCenter: viewport.voi.windowCenter
        },
        invert: viewport.invert,
        rotation: viewport.rotation,
        hflip: viewport.hflip,
        vflip: viewport.vflip
      }
    } catch (error) {
      console.error('Failed to get viewport:', error)
      return null
    }
  }
  
  public setViewport(element: HTMLDivElement, viewport: Partial<ViewportState>): void {
    try {
      const currentViewport = cornerstone.getViewport(element)
      const newViewport = { ...currentViewport, ...viewport }
      cornerstone.setViewport(element, newViewport)
    } catch (error) {
      console.error('Failed to set viewport:', error)
    }
  }
  
  public resetViewport(element: HTMLDivElement): void {
    try {
      cornerstone.reset(element)
    } catch (error) {
      console.error('Failed to reset viewport:', error)
    }
  }
  
  public fitToWindow(element: HTMLDivElement): void {
    try {
      cornerstone.fitToWindow(element)
    } catch (error) {
      console.error('Failed to fit to window:', error)
    }
  }
}

// Singleton instance
export const cornerstoneService = new CornerstoneService()