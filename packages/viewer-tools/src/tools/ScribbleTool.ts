// packages/viewer-tools/src/tools/ScribbleTool.ts
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'

export interface ScribbleAnnotation {
  type: 'scribble'
  class_id: number
  polarity: 'pos' | 'neg'
  points: Array<{x: number, y: number}>
  color: string
}

export class ScribbleTool extends cornerstoneTools.BaseBrushTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'Scribble',
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        radius: 5,
        polarity: 'pos',
        classId: null,
        color: '#00ff00',
      },
    }
    
    super(props, defaultProps)
    
    this.isMultiPartTool = true
  }
  
  preMouseDownCallback(evt: any) {
    const eventData = evt.detail
    const { element, currentPoints } = eventData
    
    if (!this.configuration.classId) {
      console.warn('No pathology class selected')
      return false
    }
    
    const enabledElement = cornerstone.getEnabledElement(element)
    
    if (!enabledElement.image) {
      return false
    }
    
    return true
  }
  
  renderBrush(evt: any) {
    const eventData = evt.detail
    const { element, canvasContext, currentPoints } = eventData
    
    if (!currentPoints || currentPoints.length === 0) {
      return
    }
    
    const configuration = this.configuration
    const radius = configuration.radius
    const color = configuration.polarity === 'pos' ? '#00ff00' : '#ff0000'
    
    canvasContext.save()
    
    // Set composite operation for eraser
    if (configuration.erase) {
      canvasContext.globalCompositeOperation = 'destination-out'
    }
    
    // Draw the brush stroke
    canvasContext.strokeStyle = color
    canvasContext.lineWidth = radius * 2
    canvasContext.lineCap = 'round'
    canvasContext.lineJoin = 'round'
    canvasContext.globalAlpha = 0.5
    
    canvasContext.beginPath()
    canvasContext.moveTo(currentPoints[0].x, currentPoints[0].y)
    
    for (let i = 1; i < currentPoints.length; i++) {
      canvasContext.lineTo(currentPoints[i].x, currentPoints[i].y)
    }
    
    canvasContext.stroke()
    canvasContext.restore()
  }
  
  _endPainting(evt: any) {
    const eventData = evt.detail
    const { element } = eventData
    
    const enabledElement = cornerstone.getEnabledElement(element)
    const toolState = cornerstoneTools.getToolState(element, this.name)
    
    if (!toolState || !toolState.data || toolState.data.length === 0) {
      return
    }
    
    const data = toolState.data[toolState.data.length - 1]
    
    // Convert to annotation format
    const annotation: ScribbleAnnotation = {
      type: 'scribble',
      class_id: this.configuration.classId,
      polarity: this.configuration.polarity,
      points: data.handles.map((p: any) => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
      })),
      color: this.configuration.color,
    }
    
    // Emit custom event with annotation data
    const annotationEvent = new CustomEvent('scribbleCompleted', {
      detail: { annotation },
    })
    element.dispatchEvent(annotationEvent)
    
    cornerstone.updateImage(element)
  }
}

// Register the tool
cornerstoneTools.addTool(ScribbleTool)