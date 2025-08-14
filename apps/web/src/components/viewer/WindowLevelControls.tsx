// apps/web/src/components/viewer/WindowLevelControls.tsx
import { useState, useCallback } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { ViewportState } from '@/services/CornerstoneService'

interface WindowLevelControlsProps {
  viewport: ViewportState | null
  onViewportChange: (viewport: Partial<ViewportState>) => void
  onReset: () => void
}

// Common window/level presets for chest X-rays
const PRESETS = [
  { name: 'Chest', windowWidth: 400, windowCenter: 40 },
  { name: 'Lungs', windowWidth: 1500, windowCenter: -600 },
  { name: 'Bone', windowWidth: 1000, windowCenter: 400 },
  { name: 'Soft Tissue', windowWidth: 350, windowCenter: 50 },
  { name: 'Default', windowWidth: 255, windowCenter: 128 }
]

export function WindowLevelControls({
  viewport,
  onViewportChange,
  onReset
}: WindowLevelControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const handleWindowWidthChange = useCallback((values: number[]) => {
    onViewportChange({
      voi: {
        windowWidth: values[0],
        windowCenter: viewport?.voi?.windowCenter || 128
      }
    })
  }, [viewport?.voi?.windowCenter, onViewportChange])
  
  const handleWindowCenterChange = useCallback((values: number[]) => {
    onViewportChange({
      voi: {
        windowWidth: viewport?.voi?.windowWidth || 255,
        windowCenter: values[0]
      }
    })
  }, [viewport?.voi?.windowWidth, onViewportChange])
  
  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    onViewportChange({
      voi: {
        windowWidth: preset.windowWidth,
        windowCenter: preset.windowCenter
      }
    })
  }, [onViewportChange])
  
  const toggleInvert = useCallback(() => {
    onViewportChange({
      invert: !viewport?.invert
    })
  }, [viewport?.invert, onViewportChange])
  
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
        <h3 className="text-sm font-medium text-white">Pencere/Seviye</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onReset}
          className="h-8 w-8 p-0"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.name}
            size="sm"
            variant="outline"
            onClick={() => applyPreset(preset)}
            className="text-xs h-8"
          >
            {preset.name}
          </Button>
        ))}
      </div>
      
      {/* Current Values Display */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="text-center">
          <div className="text-gray-400">Genişlik</div>
          <div className="text-white font-mono">
            {Math.round(viewport.voi.windowWidth)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Merkez</div>
          <div className="text-white font-mono">
            {Math.round(viewport.voi.windowCenter)}
          </div>
        </div>
      </div>
      
      {/* Advanced Controls */}
      <div className="space-y-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-xs"
        >
          {showAdvanced ? 'Gizle' : 'Detaylı Ayarlar'}
        </Button>
        
        {showAdvanced && (
          <>
            {/* Window Width Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Pencere Genişliği</span>
                <span>{Math.round(viewport.voi.windowWidth)}</span>
              </div>
              <Slider
                value={[viewport.voi.windowWidth]}
                onValueChange={handleWindowWidthChange}
                min={1}
                max={2000}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Window Center Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Pencere Merkezi</span>
                <span>{Math.round(viewport.voi.windowCenter)}</span>
              </div>
              <Slider
                value={[viewport.voi.windowCenter]}
                onValueChange={handleWindowCenterChange}
                min={-1000}
                max={1000}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Invert Button */}
            <Button
              size="sm"
              variant={viewport.invert ? "default" : "outline"}
              onClick={toggleInvert}
              className="w-full"
            >
              {viewport.invert ? 'Normal' : 'Ters Çevir'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}