// apps/web/src/pages/Dashboard.tsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Activity, CheckCircle, FileText, User, Clock, Queue } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'

export function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats/overview').then(res => res.data),
    refetchInterval: 30000, // 30 saniyede bir güncelle
  })
  
  const handleStartSegmentation = async () => {
    try {
      const response = await api.post('/tasks/next')
      const task = response.data
      navigate(`/viewer/${task.id}`)
    } catch (error) {
      console.error('Görev alınamadı:', error)
    }
  }
  
  const statCards = [
    {
      title: "Toplam vaka sayısı",
      value: stats?.total || 0,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Etiketlemesi tamamlanmış vaka",
      value: stats?.done || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Pozitif bulgu sözlüğü",
      value: stats?.positive_vocab || 0,
      icon: Activity,
      color: "text-purple-600",
    },
    {
      title: "Etiketlemesini tamamladığınız vaka sayısı",
      value: stats?.done_by_me || 0,
      icon: User,
      color: "text-orange-600",
    },
    {
      title: "Bugün etiketlenen",
      value: stats?.today_done || 0,
      icon: Clock,
      color: "text-indigo-600",
    },
    {
      title: "Kuyrukta bekleyen",
      value: stats?.queued || 0,
      icon: Queue,
      color: "text-red-600",
    },
  ]
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Hoş geldiniz, {user?.full_name || user?.email}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Neonatal CXR Segmentasyon Sistemi
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleStartSegmentation}
          disabled={stats?.queued === 0}
          className="px-8 py-6 text-lg"
        >
          Segmentlemeye Başla
        </Button>
      </div>
    </div>
  )
}