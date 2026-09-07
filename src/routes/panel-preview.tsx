import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ChevronDown,
  LayoutDashboard,
  Building2,
  Settings,
  Wifi,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/panel-preview")({
  ssr: false,
  component: PanelPreviewPage,
});

function PanelPreviewPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex antialiased">
      {/* Sidebar Corporativo Real */}
      <aside className="w-64 shrink-0 border-r border-slate-200/80 bg-white p-5 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 px-2 mb-8">
            <img
              src="/assets/logos/logo_orbynex_horizontal_claro_v2.png"
              alt="Orbynex Digital"
              className="h-8 w-auto"
            />
          </div>

          {/* Navegación */}
          <nav className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm">
              <LayoutDashboard className="size-4" />
              <span>Panel</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition">
              <FileText className="size-4 text-slate-400" />
              <span>Cotizaciones</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition">
              <Users className="size-4 text-slate-400" />
              <span>Clientes</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition">
              <Building2 className="size-4 text-slate-400" />
              <span>Mi Negocio</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 font-medium text-sm transition">
              <Settings className="size-4 text-slate-400" />
              <span>Configuración</span>
            </div>
          </nav>
        </div>

        {/* User Card en Sidebar */}
        <div className="border-t border-slate-100 pt-4 flex items-center gap-3 px-2">
          <div className="size-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            OM
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">Orbynex Comercial</p>
            <p className="text-[11px] text-slate-400 truncate">admin@orbynexdigital.cl</p>
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="size-3" />
              Sincronización en tiempo real
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button className="btn-orbynex-primary h-9 rounded-xl px-4 text-xs font-semibold text-white border-none flex items-center gap-1.5 shadow-sm">
              <Plus className="size-4" />
              Nueva cotización
            </Button>
          </div>
        </header>

        {/* Contenido del Panel */}
        <main className="p-6 md:p-8 space-y-6 max-w-6xl w-full">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Panel de Cotizaciones</h1>
            <p className="text-xs text-slate-500 mt-1">
              Tu actividad comercial activa, métricas en pesos chilenos y cotizaciones por cliente.
            </p>
          </div>

          {/* 4 Tarjetas de Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Cotizaciones Totales</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5">24</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Monto Aceptado</p>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">$14.850.000</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">En Negociación</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5">6</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="size-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Clientes Activos</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-0.5">18</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listado de Clientes con Acordeones Desplegados */}
          <div className="space-y-4">
            {/* Cliente 1: Soluciones Andinas SpA */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 text-white font-bold flex items-center justify-center text-sm">
                    SA
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Soluciones Andinas SpA</h3>
                    <p className="text-xs text-slate-400">RUT: 76.845.120-3 · Contacto: Carlos Mendoza</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="block text-sm font-bold text-slate-900">$4.340.000 CLP</span>
                    <span className="block text-[11px] text-slate-400">2 cotizaciones</span>
                  </div>
                  <ChevronDown className="size-4 text-slate-400" />
                </div>
              </div>

              {/* Items dentro de la cotización */}
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/60 transition">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">N° 0089 · Servicio de Migración Cloud y Seguridad</p>
                      <p className="text-[11px] text-slate-400">02 Sep 2026 · Validez: 30 días</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">$2.450.000</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Aceptada ✓
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/60 transition">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">N° 0088 · Mantención Mensual de Infraestructura</p>
                      <p className="text-[11px] text-slate-400">28 Ago 2026 · Validez: 15 días</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">$1.890.000</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      Enviada
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cliente 2: Inversiones del Sur Ltda */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm">
                    IS
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Inversiones del Sur Ltda</h3>
                    <p className="text-xs text-slate-400">RUT: 77.210.340-K · Contacto: Valeria Gómez</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="block text-sm font-bold text-slate-900">$5.200.000 CLP</span>
                    <span className="block text-[11px] text-slate-400">2 cotizaciones</span>
                  </div>
                  <ChevronDown className="size-4 text-slate-400" />
                </div>
              </div>

              <div className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">N° 0087 · Desarrollo de Portal B2B Cotizador</p>
                      <p className="text-[11px] text-slate-400">25 Ago 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">$3.100.000</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Aceptada ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
