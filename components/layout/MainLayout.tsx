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
      className={`flex min-h-screen w-full overflow-hidden ${
        dark ? "bg-[#07111f]" : "bg-[#F6F8FB]"
      }`}
    >
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main
          className={`min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto ${
            dark ? "bg-[#07111f]" : ""
          }`}
        >
          {fullWidth ? (
            <div className="min-w-0 pt-16 md:pt-0">
              {children}
            </div>
          ) : (
            <div
              className="
                min-w-0
                px-4
                pb-6
                pt-20
                sm:px-5
                sm:pb-7
                md:px-6
                md:pt-6
                lg:px-8
                lg:py-7
              "
            >
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}