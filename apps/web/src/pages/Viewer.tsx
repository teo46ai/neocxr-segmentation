// apps/web/src/pages/Viewer.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { useDicom } from '@/hooks/useDicom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { WindowLevelControls } from '@/components/viewer/WindowLevelControls'
import { ZoomPanControls } from '@/components/viewer/ZoomPanControls'
import { PathologyPanel } from '@/components/viewer/PathologyPanel'
import { MetadataPanel } from '@/components/viewer/MetadataPanel'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Home, 
  Save, 
  CheckCircle,
  AlertCircle,
  MousePointer2,
  Brush,
  Eraser,
  Spline,
  Square
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Tool {
  id: string
  name: string
  icon: React.ComponentType<any>
  shortcut?: string
}

const tools: Tool[] = [
  { id: 'cursor', name: 'İmleç', icon: MousePointer2, shortcut: 'C' },
  { id: 'scribble-positive', name: 'Pozitif Fırça', icon: Brush, shortcut: 'P' },
  { id: 'scribble-negative', name: 'Negatif Fırça', icon: Brush, shortcut: 'N' },
  { id: 'eraser', name: 'Silgi', icon: Eraser, shortcut: 'E' },
  { id: 'polyline', name: 'Çizgi', icon: Spline, shortcut: 'L' },
]

export function Viewer() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const viewerRef = useRef<HTMLDivElement>(null)
  
  // State
  const [activeTool, setActiveTool] = useState('cursor')
  const [brushSize, setBrushSize] = useState(5)
  const [confidence, setConfidence] = useState(100)
  const [notes, setNotes] = useState('')
  const [selectedPathology, setSelectedPathology] = useState<number | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  
  // Initialize DICOM hook
  const {
    instance,
    imageId,
    isLoading: isDicomLoading,
    error: dicomError,
    loadImage,
    viewport,
    setViewport,
    resetViewport,
    fitToWindow
  } = useDicom(viewerRef.current)
  
  // Fetch task data
  const { data: task, isLoading: isTaskLoading, error: taskError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then(res => res.data),
    retry: 1
  })
  
  // Load DICOM image when task is loaded
  useEffect(() => {
    if (task?.study?.instances?.[0]) {
      const instanceId = task.study.instances[0].id
      loadImage(instanceId).catch(error => {
        console.error('DICOM loading error:', error)
        toast.error(`DICOM yüklenemedi: ${error.message}`)
      })
    }
  }, [task, loadImage])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (event.key.toLowerCase()) {
        case 'c':
          setActiveTool('cursor')
          break
        case 'p':
          setActiveTool('scribble-positive')
          break
        case 'n':
          setActiveTool('scribble-negative')
          break
        case 'e':
          setActiveTool('eraser')
          break
        case 'l':
          setActiveTool('polyline')
          break
        case '[':
          setBrushSize(prev => Math.max(1, prev - 1))
          break
        case ']':
          setBrushSize(prev => Math.min(20, prev + 1))
          break
        case 's':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            handleSave()
          }
          break
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            handleComplete()
          }
          break
        case 'Escape':
          handleBackToDashboard()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault()
        event.returnValue = 'Kaydedilmemiş değişiklikler var. Sayfayı kapatmak istediğinizden emin misiniz?'
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/annotations', data),
    onSuccess: () => {
      toast.success('Etiketler kaydedildi')
      setIsDirty(false)
    },
    onError: (error: any) => {
      toast.error('Kayıt hatası: ' + error.message)
    }
  })
  
  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/complete`),
    onSuccess: () => {
      toast.success('Görev tamamlandı')
      setIsDirty(false)
      navigate('/dashboard')
    },
    onError: (error: any) => {
      toast.error('Tamamlama hatası: ' + error.message)
    }
  })
  
  const handleSave = () => {
    if (!taskId) return
    
    // TODO: Collect actual annotation data from tools
    const annotationData = {
      task_id: parseInt(taskId),
      items: [], // Will be populated with actual annotations later
      meta: {
        confidence,
        notes,
      },
    }
    
    saveMutation.mutate(annotationData)
  }
  
  const handleComplete = () => {
    if (!selectedPathology && activeTool !== 'cursor') {
      toast.error('Lütfen bir patoloji seçin')
      return
    }
    
    if (confirm('Etiketlemeyi tamamlamak istediğinizden emin misiniz?')) {
      if (isDirty) {
        handleSave()
        // Complete after save
        setTimeout(() => completeMutation.mutate(), 1000)
      } else {
        completeMutation.mutate()
      }
    }
  }
  
  const handleBackToDashboard = () => {
    if (isDirty) {
      if (confirm('Kaydedilmemiş değişiklikler var. Ana menüye dönmek istediğinizden emin misiniz?')) {
        // Release task lock
        api.post(`/tasks/${taskId}/release`).finally(() => {
          navigate('/dashboard')
        })
      }
    } else {
      navigate('/dashboard')
    }
  }
  
  const handleToolChange = (toolId: string) => {
    setActiveTool(toolId)
    setIsDirty(true)
  }
  
  const handlePathologySelect = (pathologyId: number | null) => {
    setSelectedPathology(pathologyId)
  }
  
  // Error states
  if (taskError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-white mb-4">Görev yüklenirken hata oluştu</p>
          <p className="text-gray-400 mb-6">{taskError.message}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Ana Menüye Dön
          </Button>
        </div>
      </div>
    )
  }
  
  // Loading states
  if (isTaskLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-white">Görev yükleniyor...</span>
      </div>
    )
  }
  
  if (!task) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-white mb-4">Görev bulunamadı</p>
          <Button onClick={() => navigate('/dashboard')}>
            Ana Menüye Dön
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
        {/* Left: Tools */}
        <div className="flex items-center gap-2">
          {tools.map((tool) => {
            const isNegative = tool.id === 'scribble-negative'
            const isActive = activeTool === tool.id
            
            return (
              <Button
                key={tool.id}
                size="sm"
                variant={isActive ? "default" : "ghost"}
                onClick={() => handleToolChange(tool.id)}
                title={`${tool.name} (${tool.shortcut})`}
                className={cn(
                  "flex items-center gap-1",
                  isActive && isNegative && "bg-red-600 hover:bg-red-700"
                )}
              >
                <tool.icon className={cn('h-4 w-4', isNegative && 'text-red-200')} />
                <span className="hidden md:inline text-xs">{tool.name}</span>
              </Button>
            )
          })}
          
          {/* Brush Size - only show for scribble tools */}
          {activeTool.includes('scribble') && (
            <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-gray-700 rounded">
              <span className="text-xs text-gray-300">Fırça:</span>
              <div className="w-20">
                <Slider
                  value={[brushSize]}
                  onValueChange={([value]) => setBrushSize(value)}
                  min={1}
                  max={20}
                  step={1}
                  className="h-4"
                />
              </div>
              <span className="text-xs text-gray-400 w-6">{brushSize}</span>
            </div>
          )}
        </div>
        
        {/* Center: Study Info */}
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <span>Study: {task.study.study_uid.slice(-8)}</span>
          <span>Patient: {task.study.patient_id || 'N/A'}</span>
        </div>
        
        {/* Right: Status */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <div className="flex items-center gap-1 text-orange-400 text-xs">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              Kaydedilmemiş değişiklikler
            </div>
          )}
          {isDicomLoading && (
            <div className="flex items-center gap-1 text-blue-400 text-xs">
              <LoadingSpinner size="xs" />
              DICOM yükleniyor...
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Left Panel - Pathology Selection */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-medium text-white mb-3">Patoloji Seçimi</h3>
            <PathologyPanel
              selectedPathology={selectedPathology}
              onSelect={handlePathologySelect}
            />
          </div>
          
          {/* Window/Level Controls */}
          <div className="p-4 border-b border-gray-700">
            <WindowLevelControls
              viewport={viewport}
              onViewportChange={setViewport}
              onReset={resetViewport}
            />
          </div>
          
          {/* Zoom/Pan Controls */}
          <div className="p-4 flex-1">
            <ZoomPanControls
              viewport={viewport}
              onViewportChange={setViewport}
              onFitToWindow={fitToWindow}
              onReset={resetViewport}
            />
          </div>
        </div>
        
        {/* Center - DICOM Viewer */}
        <div className="flex-1 relative bg-black">
          {dicomError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p className="text-white mb-2">DICOM yüklenemedi</p>
                <p className="text-gray-400 text-sm">{dicomError.message}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cornerstone Viewer Element */}
              <div
                ref={viewerRef}
                className="absolute inset-0"
                style={{ touchAction: 'none' }}
              />
              
              {/* Loading Overlay */}
              {isDicomLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-white mt-4">DICOM görüntüsü yükleniyor...</p>
                  </div>
                </div>
              )}
              
              {/* Viewport Info Overlay */}
              {viewport && !isDicomLoading && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded space-y-1">
                  <div>Yakınlaştırma: {Math.round(viewport.scale * 100)}%</div>
                  <div>WW: {Math.round(viewport.voi.windowWidth)} WC: {Math.round(viewport.voi.windowCenter)}</div>
                  {viewport.invert && <div className="text-yellow-400">Ters çevrilmiş</div>}
                </div>
              )}
              
              {/* Tool Instructions */}
              {activeTool !== 'cursor' && selectedPathology && (
                <div className="absolute top-4 right-4 bg-blue-900 bg-opacity-90 text-white text-xs p-3 rounded max-w-xs">
                  <div className="font-medium mb-1">
                    {tools.find(t => t.id === activeTool)?.name} Aktif
                  </div>
                  <div>
                    {activeTool.includes('scribble') && 'Sol tık ile çizin, sağ tık ile iptal edin'}
                    {activeTool === 'polyline' && 'Çizgi çizmek için tıklayın, çift tık ile bitirin'}
                    {activeTool === 'eraser' && 'Silmek için çizin'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Right Panel - Metadata & Settings */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Study Metadata */}
          <div className="p-4 border-b border-gray-700">
            <MetadataPanel study={task.study} />
          </div>
          
          {/* Confidence & Notes */}
          <div className="p-4 border-b border-gray-700 space-y-4">
            <div>
              <label className="text-sm text-gray-300 block mb-2">
                Güven Puanı: {confidence}%
              </label>
              <Slider
                value={[confidence]}
                onValueChange={([value]) => {
                  setConfidence(value)
                  setIsDirty(true)
                }}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-300 block mb-2">
                Notlar
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setIsDirty(true)
                }}
                placeholder="Ek notlar..."
                className="w-full h-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm resize-none"
              />
            </div>
          </div>
          
          {/* Shortcuts Help */}
          <div className="p-4 flex-1">
            <h4 className="text-sm font-medium text-white mb-3">Kısayollar</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Pozitif fırça</span>
                <kbd className="bg-gray-700 px-1 rounded">P</kbd>
              </div>
              <div className="flex justify-between">
                <span>Negatif fırça</span>
                <kbd className="bg-gray-700 px-1 rounded">N</kbd>
              </div>
              <div className="flex justify-between">
                <span>Fırça boyutu</span>
                <kbd className="bg-gray-700 px-1 rounded">[ ]</kbd>
              </div>
              <div className="flex justify-between">
                <span>Kaydet</span>
                <kbd className="bg-gray-700 px-1 rounded">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span>Tamamla</span>
                <kbd className="bg-gray-700 px-1 rounded">Ctrl+Enter</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Ana Menüye Dön
        </Button>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Kaydediliyor...' : 'Taslak Kaydet'}
          </Button>
          
          <Button 
            onClick={handleComplete}
            disabled={completeMutation.isPending || (!selectedPathology && activeTool !== 'cursor')}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {completeMutation.isPending ? 'Tamamlanıyor...' : 'Etiketlemeyi Gönder'}
          </Button>
        </div>
      </div>
    </div>
  )
}