// apps/web/src/components/viewer/AnnotationToolbar.tsx
import { MousePointer2, Brush, Eraser, Spline, Square, ZoomIn, Move, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface Tool {
  id: string
  name: string
  icon: React.ComponentType<any>
  group?: string
}

const tools: Tool[] = [
  { id: 'cursor', name: 'İmleç', icon: MousePointer2, group: 'pointer' },
  { id: 'scribble-positive', name: 'Pozitif Fırça', icon: Brush, group: 'annotation' },
  { id: 'scribble-negative', name: 'Negatif Fırça', icon: Brush, group: 'annotation' },
  { id: 'eraser', name: 'Silgi', icon: Eraser, group: 'annotation' },
  { id: 'polyline', name: 'Çizgi', icon: Spline, group: 'annotation' },
  { id: 'rectangle', name: 'Dikdörtgen', icon: Square, group: 'annotation' },
  { id: 'zoom', name: 'Yakınlaştır', icon: ZoomIn, group: 'view' },
  { id: 'pan', name: 'Kaydır', icon: Move, group: 'view' },
]

interface AnnotationToolbarProps {
  activeTool: string
  onToolChange: (toolId: string) => void
  brushSize?: number
  onBrushSizeChange?: (size: number) => void
}

export function AnnotationToolbar({
  activeTool,
  onToolChange,
  brushSize = 5,
  onBrushSizeChange,
}: AnnotationToolbarProps) {
  const annotationTools = tools.filter(t => t.group === 'annotation')
  const viewTools = tools.filter(t => t.group === 'view')
  const pointerTools = tools.filter(t => t.group === 'pointer')
  
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
      {/* Pointer Tools */}
      <div className="flex gap-1">
        {pointerTools.map((tool) => (
          <Button
            key={tool.id}
            size="icon"
            variant={activeTool === tool.id ? 'default' : 'ghost'}
            onClick={() => onToolChange(tool.id)}
            title={tool.name}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* Annotation Tools */}
      <div className="flex gap-1">
        {annotationTools.map((tool) => {
          const isNegative = tool.id === 'scribble-negative'
          return (
            <Button
              key={tool.id}
              size="icon"
              variant={activeTool === tool.id ? 'default' : 'ghost'}
              onClick={() => onToolChange(tool.id)}
              title={tool.name}
              className={cn(
                activeTool === tool.id && isNegative && 'bg-red-600 hover:bg-red-700'
              )}
            >
              <tool.icon className={cn('h-4 w-4', isNegative && 'text-red-200')} />
            </Button>
          )
        })}
      </div>
      
      {/* Brush Size */}
      {activeTool.includes('scribble') && (
        <>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Fırça:</span>
            <div className="w-32">
              <Slider
                value={[brushSize]}
                onValueChange={([value]) => onBrushSizeChange?.(value)}
                min={1}
                max={20}
                step={1}
              />
            </div>
            <span className="text-sm text-gray-500 w-8">{brushSize}</span>
          </div>
        </>
      )}
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* View Tools */}
      <div className="flex gap-1">
        {viewTools.map((tool) => (
          <Button
            key={tool.id}
            size="icon"
            variant={activeTool === tool.id ? 'default' : 'ghost'}
            onClick={() => onToolChange(tool.id)}
            title={tool.name}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      
      <div className="flex-1" />
      
      {/* Actions */}
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" title="Geri Al (Z)">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" title="Kaydet (Ctrl+S)">
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}