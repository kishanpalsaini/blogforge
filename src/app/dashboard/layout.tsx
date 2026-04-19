import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: blogs } = await supabase
    .from('blogs')
    .select('id, name, slug')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <DashboardLayout blogs={blogs ?? []} userEmail={user.email ?? ''}>
      {children}
    </DashboardLayout>
  )
}
