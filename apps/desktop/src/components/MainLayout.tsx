import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  ChartLineUp,
  Lightning,
  Plug,
  Stack,
  FileText,
  GearSix,
  ShieldCheck,
  Cloud,
  Wrench,
  Question,
  Info,
  SignOut,
} from '@phosphor-icons/react'
import { logout } from '../services/api'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from './ui/sidebar'

interface NavItem {
  to: string
  icon: React.ComponentType<{ size?: number; weight?: 'regular' | 'fill' | 'duotone' | 'bold' }>
  label: string
  match?: string[]
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: 'Monitor',
    items: [
      { to: '/dashboard', icon: ChartLineUp, label: 'Dashboard', match: ['/dashboard'] },
      { to: '/devices', icon: Plug, label: 'Dispositivos', match: ['/devices'] },
      { to: '/overlays', icon: Stack, label: 'Overlays', match: ['/overlays', '/overlay'] },
    ],
  },
  {
    label: 'Cloud',
    items: [{ to: '/cloud', icon: Cloud, label: 'Cloud', match: ['/cloud'] }],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/tools', icon: Wrench, label: 'Ferramentas', match: ['/tools'] },
      { to: '/logs', icon: FileText, label: 'Logs', match: ['/logs'] },
      { to: '/settings', icon: GearSix, label: 'Configurações', match: ['/settings'] },
      { to: '/security', icon: ShieldCheck, label: 'Segurança', match: ['/security'] },
    ],
  },
  {
    label: '',
    items: [
      { to: '/help', icon: Question, label: 'Ajuda', match: ['/help'] },
      { to: '/about', icon: Info, label: 'Sobre', match: ['/about'] },
    ],
  },
]

function isActive(pathname: string, item: NavItem): boolean {
  const patterns = item.match || [item.to]
  return patterns.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function AppSidebar() {
  const location = useLocation()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            <Lightning size={20} weight="fill" className="text-primary" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Lightning size={22} weight="fill" className="text-primary" />
            <span className="font-heading text-xl font-bold text-foreground tracking-wide">
              PowerGrid
            </span>
          </div>
        )}
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <SidebarGroup>
              {section.label && (
                <SidebarGroupLabel className="nav-section-divider">
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const active = isActive(location.pathname, item)
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                          className={
                            active
                              ? 'text-primary bg-primary/15 rounded-lg'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg'
                          }
                        >
                          <Link to={item.to}>
                            <Icon size={18} weight={active ? 'fill' : 'regular'} />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
            >
              <SignOut size={18} />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export function MainLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
