// packages/viewer-tools/src/tools/PolylineTool.ts
export interface PolylineAnnotation {
  type: 'polyline'
  class_id: number
  points: Array<{x: number, y: number}>
  closed: boolean
  color: string
}

export class PolylineTool extends cornerstoneTools.BaseTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'Polyline',
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        classId: null,
        color: '#ffff00',
        lineWidth: 2,
        drawHandles: true,
        handleRadius: 4,
      },
    }
    
    super(props, defaultProps)
    
    this.isCreating = false
  }
  
  createNewMeasurement(eventData: any) {
    return {
      visible: true,
      active: true,
      color: this.configuration.color,
      classId: this.configuration.classId,
      handles: {
        points: [],
      },
    }
  }
  
  handleLeftClick(evt: any) {
    const eventData = evt.detail
    const { element, currentPoints } = eventData
    
    if (!this.configuration.classId) {
      console.warn('No device class selected')
      return false
    }
    
    const coords = eventData.currentPoints.canvas
    
    if (this.isCreating) {
      // Add point to current polyline
      const toolState = cornerstoneTools.getToolState(element, this.name)
      const data = toolState.data[toolState.data.length - 1]
      
      data.handles.points.push({
        x: coords.x,
        y: coords.y,
        highlight: true,
        active: true,
      })
      
      cornerstone.updateImage(element)
      return true
    } else {
      // Start new polyline
      this.isCreating = true
      const measurementData = this.createNewMeasurement(eventData)
      
      measurementData.handles.points.push({
        x: coords.x,
        y: coords.y,
        highlight: true,
        active: true,
      })
      
      cornerstoneTools.addToolState(element, this.name, measurementData)
      cornerstone.updateImage(element)
      return true
    }
  }
  
  handleDoubleClick(evt: any) {
    if (this.isCreating) {
      this.isCreating = false
      this._finalizePolyline(evt.detail.element)
      return true
    }
    return false
  }
  
  renderToolData(evt: any) {
    const eventData = evt.detail
    const { element, canvasContext, image } = eventData
    const toolState = cornerstoneTools.getToolState(element, this.name)
    
    if (!toolState || !toolState.data || !toolState.data.length) {
      return
    }
    
    const config = this.configuration
    
    toolState.data.forEach((data: any) => {
      if (!data.visible) return
      
      const points = data.handles.points
      if (points.length < 2) return
      
      canvasContext.save()
      
      // Draw polyline
      canvasContext.strokeStyle = data.color || config.color
      canvasContext.lineWidth = config.lineWidth
      canvasContext.beginPath()
      
      canvasContext.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        canvasContext.lineTo(points[i].x, points[i].y)
      }
      
      canvasContext.stroke()
      
      // Draw handles
      if (config.drawHandles) {
        points.forEach((point: any) => {
          canvasContext.beginPath()
          canvasContext.arc(point.x, point.y, config.handleRadius, 0, 2 * Math.PI)
          canvasContext.fillStyle = point.active ? '#ff0000' : data.color
          canvasContext.fill()
        })
      }
      
      canvasContext.restore()
    })
  }
  
  _finalizePolyline(element: HTMLElement) {
    const toolState = cornerstoneTools.getToolState(element, this.name)
    if (!toolState || !toolState.data || toolState.data.length === 0) {
      return
    }
    
    const data = toolState.data[toolState.data.length - 1]
    
    // Convert to annotation format
    const annotation: PolylineAnnotation = {
      type: 'polyline',
      class_id: this.configuration.classId,
      points: data.handles.points.map((p: any) => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
      })),
      closed: false,
      color: data.color,
    }
    
    // Emit custom event
    const annotationEvent = new CustomEvent('polylineCompleted', {
      detail: { annotation },
    })
    element.dispatchEvent(annotationEvent)
    
    cornerstone.updateImage(element)
  }
}

cornerstoneTools.addTool(Polylin