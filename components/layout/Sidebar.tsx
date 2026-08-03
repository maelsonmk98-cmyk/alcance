import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Calculator,
  FileText,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-72 h-screen bg-[#081E4A] text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-900">
        <h1 className="text-3xl font-bold">Alcance</h1>
        <p className="text-sm text-gray-300">
          Análise de Produtos e Margens
        </p>
      </div>

      {/* Menu */}
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">

          <li>
            <Link
              href="/"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-700 transition"
            >
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
          </li>

          <li>
            <Link
              href="/produtos"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-700 transition"
            >
              <Package size={20} />
              Produtos
            </Link>
          </li>

          <li>
            <Link
              href="/calculadora"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-700 transition"
            >
              <Calculator size={20} />
              Calculadora
            </Link>
          </li>

          <li>
            <Link
              href="/relatorios"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-700 transition"
            >
              <FileText size={20} />
              Relatórios
            </Link>
          </li>

          <li>
            <Link
              href="/configuracoes"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-700 transition"
            >
              <Settings size={20} />
              Configurações
            </Link>
          </li>

        </ul>
      </nav>

      {/* Rodapé */}
      <div className="p-6 border-t border-blue-900 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Alcance
      </div>
    </aside>
  );
}