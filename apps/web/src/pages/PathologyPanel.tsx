// apps/web/src/components/viewer/PathologyPanel.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CheckCircle, Circle } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface PathologyClass {
  id: number
  name: string
  name_tr: string
  color: string
  priority: number
}

interface PathologyPanelProps {
  selectedPathology: number | null
  onSelect: (pathologyId: number | null) => void
}

export function PathologyPanel({ selectedPathology, onSelect }: PathologyPanelProps) {
  const { data: pathologies, isLoading } = useQuery({
    queryKey: ['ontology', 'pathology'],
    queryFn: () => api.get('/ontology/classes?kind=pathology').then(res => res.data),
  })
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {/* No Finding Option */}
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          id="no-finding"
          name="pathology"
          checked={selectedPathology === null}
          onChange={() => onSelect(null)}
          className="sr-only"
        />
        <Label
          htmlFor="no-finding"
          className={cn(
            "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
            "hover:bg-gray-700",
            selectedPathology === null ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"
          )}
        >
          {selectedPathology === null ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">No Finding</span>
        </Label>
      </div>
      
      {/* Pathology Options */}
      {pathologies?.map((pathology: PathologyClass) => (
        <div key={pathology.id} className="flex items-center space-x-2">
          <input
            type="radio"
            id={`pathology-${pathology.id}`}
            name="pathology"
            checked={selectedPathology === pathology.id}
            onChange={() => onSelect(pathology.id)}
            className="sr-only"
          />
          <Label
            htmlFor={`pathology-${pathology.id}`}
            className={cn(
              "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors w-full",
              "hover:bg-gray-700",
              selectedPathology === pathology.id 
                ? "bg-gray-600 text-white ring-1 ring-gray-500" 
                : "bg-gray-700 text-gray-300"
            )}
          >
            {selectedPathology === pathology.id ? (
              <CheckCircle className="h-4 w-4" style={{ color: pathology.color }} />
            ) : (
              <Circle className="h-4 w-4" style={{ color: pathology.color }} />
            )}
            <div className="flex-1">
              <div className="text-sm font-medium">{pathology.name_tr}</div>
              <div className="text-xs text-gray-500">{pathology.name}</div>
            </div>
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: pathology.color }}
            />
          </Label>
        </div>
      ))}
    </div>
  )
}