'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useNavigationStore } from '../../../hooks/useNavigationStore'
import { companyService, type CompanyMember } from '../../../services/companyService'
import { toast } from 'sonner'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { UserPlus, Settings, Users, Mail, Shield, Trash2, Crown, Zap, UserCheck, Lock, ArrowRight, Check } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'

export default function TeamSettingsPage() {
  console.log('[TeamSettingsPage] Component mounted');
  const router = useRouter()
  const activeCompany = useNavigationStore(state => state.activeCompany)
  const isPersonalSpaceFromStore = useNavigationStore(state => state.isPersonalSpace)
  const currentCompany = activeCompany
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member')
  const [inviting, setInviting] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<CompanyMember | null>(null)
  
  console.log('[TeamSettingsPage] State:', {
    activeCompany,
    isPersonalSpaceFromStore,
    currentCompany
  });

  useEffect(() => {
    if (!currentCompany) {
      console.log('[TeamSettings] No currentCompany found')
      setLoading(false)
      return
    }

    console.log('[TeamSettings] Current company:', currentCompany)

    // Determinar si es un espacio personal o plan Starter
    const isPersonal = currentCompany.isPersonalSpace || currentCompany.name?.includes('Personal Space')
    const isStarter = currentCompany.plan === 'starter' || (!currentCompany.plan && !isPersonal)

    // Solo cargar miembros si no es un espacio personal Y no es plan Starter
    if (!isPersonal && !isStarter) {
      loadMembers()
    } else {
      setLoading(false)
    }
  }, [currentCompany])

  const loadMembers = async () => {
    if (!currentCompany) return

    try {
      setLoading(true)
      const membersList = await companyService.getCompanyMembers(currentCompany._id || currentCompany.id)
      setMembers(membersList)
    } catch (error: any) {
      console.error('Error loading members:', error)
      toast.error('Error al cargar los miembros del equipo')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCompany || !inviteEmail) return

    setInviting(true)
    try {
      await companyService.inviteUserToCompany(currentCompany._id || currentCompany.id, inviteEmail, inviteRole)
      toast.success(`Invitación enviada a ${inviteEmail}`)
      setInviteEmail('')
      setInviteRole('member')
      // Reload members in case the user was already registered
      await loadMembers()
    } catch (error: any) {
      console.error('Error inviting user:', error)
      toast.error(error.message || 'Error al enviar la invitación')
    } finally {
      setInviting(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentCompany) return

    try {
      await companyService.updateUserRole(currentCompany._id || currentCompany.id, userId, newRole)
      toast.success('Rol actualizado correctamente')
      await loadMembers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Error al actualizar el rol')
    }
  }

  const handleRemoveMember = async () => {
    if (!currentCompany || !memberToRemove) return

    try {
      await companyService.removeUserFromCompany(currentCompany._id || currentCompany.id, memberToRemove.user_id)
      toast.success('Miembro eliminado del equipo')
      setMemberToRemove(null)
      await loadMembers()
    } catch (error: any) {
      console.error('Error removing member:', error)
      toast.error(error.message || 'Error al eliminar el miembro')
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Propietario'
      case 'admin':
        return 'Administrador'
      case 'member':
        return 'Miembro'
      default:
        return role
    }
  }

  if (!currentCompany) {
    console.log('[TeamSettingsPage] No currentCompany, returning null');
    return (
      <div className="container max-w-6xl mx-auto py-8 px-6 h-full overflow-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No se pudo cargar la información de la compañía
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Por favor, selecciona una compañía o recarga la página.
          </p>
        </div>
      </div>
    );
  }

  const canManageTeam = currentCompany.role === 'owner' || currentCompany.role === 'admin'
  const isPersonalSpace = isPersonalSpaceFromStore || currentCompany.isPersonalSpace || currentCompany.name?.includes('Personal Space')
  const isStarterPlan = currentCompany.plan === 'starter' || (!currentCompany.plan && !isPersonalSpace)
  
  console.log('[TeamSettingsPage] Render conditions:', {
    canManageTeam,
    isPersonalSpace,
    isStarterPlan,
    plan: currentCompany.plan,
    role: currentCompany.role
  });

  // Si es un espacio personal o plan Starter, mostrar mensaje de que la funcionalidad no está disponible
  if (isPersonalSpace || isStarterPlan) {
    return (
      <div className="container max-w-6xl mx-auto p-6 h-full flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Configuración del Equipo</h1>
          <p className="text-muted-foreground text-sm">
            Gestión de miembros del equipo
          </p>
        </div>

        {/* Hero Section - Más compacto */}
        <div className="relative rounded-xl bg-gradient-to-br from-electric-purple-50 via-white to-emerald-green-50 dark:from-electric-purple-950/20 dark:via-gray-900 dark:to-emerald-green-950/20 border border-gray-200 dark:border-gray-800 flex-1 flex items-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-electric-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-green-500/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative p-8 w-full">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-electric-purple-500 to-emerald-green-500 mb-4 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {isStarterPlan ? '🚀 Potencia tu Equipo con Professional' : '🏢 Colaboración Empresarial'}
              </h2>
              
              <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
                {isStarterPlan 
                  ? 'Transforma tu flujo de trabajo individual en una máquina de colaboración. El plan Professional desbloquea herramientas poderosas para equipos en crecimiento.'
                  : 'La gestión profesional de equipos está diseñada para organizaciones que necesitan colaboración avanzada, control de accesos y flujos de trabajo eficientes.'
                }
              </p>

              {/* Benefits Grid - Más compacto */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-electric-purple-100 dark:bg-electric-purple-900/50 flex items-center justify-center mb-2 mx-auto">
                    <UserCheck className="h-5 w-5 text-electric-purple-600 dark:text-electric-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Gestión de Roles</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Asigna permisos específicos a cada miembro del equipo
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-emerald-green-100 dark:bg-emerald-green-900/50 flex items-center justify-center mb-2 mx-auto">
                    <Shield className="h-5 w-5 text-emerald-green-600 dark:text-emerald-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Seguridad Avanzada</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Control total sobre quién accede a tu infraestructura
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-electric-purple-100 dark:bg-electric-purple-900/50 flex items-center justify-center mb-2 mx-auto">
                    <Zap className="h-5 w-5 text-electric-purple-600 dark:text-electric-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Productividad x10</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Colabora en tiempo real y acelera tus despliegues
                  </p>
                </div>
              </div>

              {/* CTA Section - Más compacto */}
              <div className="flex flex-col items-center gap-3">
                <Button 
                  size="default"
                  onClick={() => router.push('/pricing')}
                  className="bg-gradient-to-r from-electric-purple-600 to-emerald-green-600 hover:from-electric-purple-700 hover:to-emerald-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Ver Planes Professional
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                {isStarterPlan && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Desde solo <span className="text-lg font-bold text-electric-purple-600 dark:text-electric-purple-400">$49</span>/mes
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-green-600 dark:text-emerald-green-400">
                      <Check className="h-3 w-3" />
                      <span>14 días de prueba gratis</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-6 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configuración del Equipo</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los miembros de {currentCompany.name}
        </p>
      </div>

      {/* Team Members */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Miembros del Equipo
          </CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando miembros...</div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {member.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name || member.email || 'Usuario'}</p>
                      <p className="text-sm text-muted-foreground">{member.user_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {canManageTeam && member.role !== 'owner' ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.user_id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="member">Miembro</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    )}
                    {canManageTeam && member.role !== 'owner' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMemberToRemove(member)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite New Members */}
      {canManageTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invitar Nuevos Miembros
            </CardTitle>
            <CardDescription>
              Invita a usuarios por correo electrónico para unirse a tu equipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={inviteRole} onValueChange={(value: 'member' | 'admin') => setInviteRole(value)}>
                    <SelectTrigger id="role">
                      <Shield className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="member">Miembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={inviting}>
                {inviting ? 'Enviando...' : 'Enviar Invitación'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro del equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a {memberToRemove?.email || 'este usuario'} del equipo.
              Ya no tendrá acceso a los recursos de la organización.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
