// apps/web/src/components/viewer/ZoomPanControls.tsx
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Move,
  RotateCw,
  FlipHorizontal,
  FlipVertical 
} from 'lucide-react'
import { ViewportState } from '@/services/CornerstoneService'

interface ZoomPanControlsProps {
  viewport: ViewportState | null
  onViewportChange: (viewport: Partial<ViewportState>) => void
  onFitToWindow: () => void
  onReset: () => void
}

export function ZoomPanControls({
  viewport,
  onViewportChange,
  onFitToWindow,
  onReset
}: ZoomPanControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const handleZoomChange = useCallback((values: number[]) => {
    onViewportChange({
      scale: values[0]
    })
  }, [onViewportChange])
  
  const zoomIn = useCallback(() => {
    const currentScale = viewport?.scale || 1
    const newScale = Math.min(currentScale * 1.25, 10)
    onViewportChange({ scale: newScale })
  }, [viewport?.scale, onViewportChange])
  
  const zoomOut = useCallback(() => {
    const currentScale = viewport?.scale || 1
    const newScale = Math.max(currentScale * 0.8, 0.1)
    onViewportChange({ scale: newScale })
  }, [viewport?.scale, onViewportChange])
  
  const resetTranslation = useCallback(() => {
    onViewportChange({
      translation: { x: 0, y: 0 }
    })
  }, [onViewportChange])
  
  const rotate = useCallback(() => {
    const currentRotation = viewport?.rotation || 0
    const newRotation = (currentRotation + 90) % 360
    onViewportChange({ rotation: newRotation })
  }, [viewport?.rotation, onViewportChange])
  
  const flipHorizontal = useCallback(() => {
    onViewportChange({
      hflip: !viewport?.hflip
    })
  }, [viewport?.hflip, onViewportChange])
  
  const flipVertical = useCallback(() => {
    onViewportChange({
      vflip: !viewport?.vflip
    })
  }, [viewport?.vflip, onViewportChange])
  
  if (!viewport) {
    return (
      <div className="p-4 bg-gray-800 text-gray-400 rounded-lg">
        <p className="text-sm">Görüntü yükleniyor...</p>
      </div>
    )
  }
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Yakınlaştırma/Kaydırma</h3>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={zoomIn}
          className="flex items-center gap-1"
        >
          <ZoomIn className="h-3 w-3" />
          <span className="text-xs">Yaklaş</span>
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={zoomOut}
          className="flex items-center gap-1"
        >
          <ZoomOut className="h-3 w-3" />
          <span className="text-xs">Uzaklaş</span>
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onFitToWindow}
          className="flex items-center gap-1"
        >
          <Maximize2 className="h-3 w-3" />
          <span className="text-xs">Sığdır</span>
        </Button>
      </div>
      
      {/* Zoom Level Display */}
      <div className="text-center">
        <div className="text-xs text-gray-400">Yakınlaştırma</div>
        <div className="text-lg font-mono text-white">
          {Math.round(viewport.scale * 100)}%
        </div>
      </div>
      
      {/* Zoom Slider */}
      <div className="space-y-2">
        <Slider
          value={[viewport.scale]}
          onValueChange={handleZoomChange}
          min={0.1}
          max={5}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>10%</span>
          <span>500%</span>
        </div>
      </div>
      
      {/* Pan Reset */}
      <Button
        size="sm"
        variant="outline"
        onClick={resetTranslation}
        className="w-full flex items-center gap-2"
      >
        <Move className="h-3 w-3" />
        Merkeze Al
      </Button>
      
      {/* Advanced Transforms */}
      <div className="space-y-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-xs"
        >
          {showAdvanced ? 'Gizle' : 'Dönüştürme'}
        </Button>
        
        {showAdvanced && (
          <div className="grid grid-cols-3 gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={rotate}
              className="flex flex-col items-center gap-1 h-12"
            >
              <RotateCw className="h-3 w-3" />
              <span className="text-xs">Döndür</span>
            </Button>
            
            <Button
              size="sm"
              variant={viewport.hflip ? "default" : "outline"}
              onClick={flipHorizontal}
              className="flex flex-col items-center gap-1 h-12"
            >
              <FlipHorizontal className="h-3 w-3" />
              <span className="text-xs">Yatay</span>
            </Button>
            
            <Button
              size="sm"
              variant={viewport.vflip ? "default" : "outline"}
              onClick={flipVertical}
              className="flex flex-col items-center gap-1 h-12"
            >
              <FlipVertical className="h-3 w-3" />
              <span className="text-xs">Dikey</span>
            </Button>
          </div>
        )}
      </div>
      
      {/* Reset All */}
      <Button
        size="sm"
        variant="destructive"
        onClick={onReset}
        className="w-full"
      >
        Tümünü Sıfırla
      </Button>
    </div>
  )
}