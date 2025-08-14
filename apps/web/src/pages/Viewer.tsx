// apps/web/src/pages/Viewer.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import cornerstone from 'cornerstone-core'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { AnnotationToolbar } from '@/components/viewer/AnnotationToolbar'
import { PathologyPanel } from '@/components/viewer/PathologyPanel'
import { MetadataPanel } from '@/components/viewer/MetadataPanel'

export function Viewer() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const viewerRef = useRef<HTMLDivElement>(null)
  const [activeTool, setActiveTool] = useState('scribble-positive')
  const [confidence, setConfidence] = useState(100)
  const [annotations, setAnnotations] = useState<any[]>([])
  
  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then(res => res.data),
  })
  
  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/annotations', data),
    onSuccess: () => {
      console.log('Etiketler kaydedildi')
    },
  })
  
  const completeMutation = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/complete`),
    onSuccess: () => {
      navigate('/dashboard')
    },
  })
  
  useEffect(() => {
    if (viewerRef.current && task?.instances?.[0]) {
      // Cornerstone viewer başlatma kodu
      cornerstone.enable(viewerRef.current)
      // ... görüntü yükleme ve araç ayarları
    }
    
    return () => {
      if (viewerRef.current) {
        cornerstone.disable(viewerRef.current)
      }
    }
  }, [task])
  
  const handleSave = () => {
    saveMutation.mutate({
      task_id: taskId,
      items: annotations,
      meta: {
        confidence,
        notes: '',
      },
    })
  }
  
  const handleComplete = () => {
    if (confirm('Etiketlemeyi tamamlamak istediğinizden emin misiniz?')) {
      handleSave()
      completeMutation.mutate()
    }
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2">
        <AnnotationToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />
      </div>
      
      <div className="flex-1 flex">
        {/* Sol Panel - Patoloji Listesi */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
          <PathologyPanel
            onSelect={(pathology) => console.log('Seçilen:', pathology)}
          />
        </div>
        
        {/* Viewer */}
        <div className="flex-1 relative">
          <div
            ref={viewerRef}
            className="absolute inset-0 bg-black"
            style={{ touchAction: 'none' }}
          />
        </div>
        
        {/* Sağ Panel - Metadata */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 space-y-4">
          <MetadataPanel study={task?.study} />
          
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Güven Puanı</label>
            <Slider
              value={[confidence]}
              onValueChange={([value]) => setConfidence(value)}
              max={100}
              step={1}
            />
            <span className="text-sm text-gray-500">{confidence}%</span>
          </div>
        </div>
      </div>
      
      {/* Alt Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 flex justify-between">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Ana Menüye Dön
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleSave}>
            Taslak Kaydet
          </Button>
          <Button onClick={handleComplete}>
            Etiketlemeyi Gönder
          </Button>
        </div>
      </div>
    </div>
  )
}