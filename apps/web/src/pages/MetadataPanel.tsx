// apps/web/src/components/viewer/MetadataPanel.tsx
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Calendar, User, Hospital, Settings } from 'lucide-react'

interface Study {
  study_uid: string
  patient_id: string
  patient_name?: string
  study_date?: string
  meta_json: {
    gestational_age?: number
    birth_weight?: number
    modality?: string
    manufacturer?: string
    institution?: string
    view_position?: string
  }
}

interface MetadataPanelProps {
  study: Study
}

export function MetadataPanel({ study }: MetadataPanelProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: tr })
    } catch {
      return dateString
    }
  }
  
  const metadata = study.meta_json || {}
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-white flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Çalışma Bilgileri
      </h3>
      
      <div className="space-y-3 text-sm">
        {/* Patient Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <User className="h-3 w-3" />
            <span className="font-medium">Hasta Bilgileri</span>
          </div>
          <div className="pl-5 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">ID:</span>
              <span className="text-white font-mono text-xs">
                {study.patient_id || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">İsim:</span>
              <span className="text-white">
                {study.patient_name || 'N/A'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Study Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">Çalışma</span>
          </div>
          <div className="pl-5 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Tarih:</span>
              <span className="text-white">
                {formatDate(study.study_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">UID:</span>
              <span className="text-white font-mono text-xs">
                ...{study.study_uid.slice(-12)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Modalite:</span>
              <span className="text-white">
                {metadata.modality || 'CR'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pozisyon:</span>
              <span className="text-white">
                {metadata.view_position || 'AP'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Clinical Info */}
        {(metadata.gestational_age || metadata.birth_weight) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Hospital className="h-3 w-3" />
              <span className="font-medium">Klinik Bilgiler</span>
            </div>
            <div className="pl-5 space-y-1">
              {metadata.gestational_age && (
                <div className="flex justify-between">
                  <span className="text-gray-400">GA:</span>
                  <span className="text-white">
                    {metadata.gestational_age} hafta
                  </span>
                </div>
              )}
              {metadata.birth_weight && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Doğum Ağırlığı:</span>
                  <span className="text-white">
                    {metadata.birth_weight}g
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Technical Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Settings className="h-3 w-3" />
            <span className="font-medium">Teknik</span>
          </div>
          <div className="pl-5 space-y-1">
            {metadata.manufacturer && (
              <div className="flex justify-between">
                <span className="text-gray-400">Üretici:</span>
                <span className="text-white text-xs">
                  {metadata.manufacturer}
                </span>
              </div>
            )}
            {metadata.institution && (
              <div className="flex justify-between">
                <span className="text-gray-400">Kurum:</span>
                <span className="text-white text-xs">
                  {metadata.institution}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}