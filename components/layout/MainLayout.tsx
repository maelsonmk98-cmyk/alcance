import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout({
  children,
  fullWidth = false,
  dark = false,
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex h-screen overflow-hidden ${
        dark ? "bg-[#07111f]" : "bg-[#F6F8FB]"
      }`}
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main
          className={`min-h-0 flex-1 overflow-y-auto ${
            dark ? "bg-[#07111f]" : ""
          }`}
        >
          {fullWidth ? (
            children
          ) : (
            <div className="px-5 py-6 sm:px-6 lg:px-8 lg:py-7">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}