import Link from "next/link";

export default function Header() {
  return (
    <header className="h-20 bg-white border-b flex items-center justify-between px-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Olá, Alcance Digital! 👋
        </h1>

        <p className="text-gray-500">
          Confira o desempenho dos seus produtos e margens.
        </p>
      </div>

      <Link
        href="/produtos/novo"
        className="bg-[#081E4A] text-white px-5 py-3 rounded-xl hover:bg-blue-900 transition"
      >
        Novo Produto
      </Link>
    </header>
  );
}