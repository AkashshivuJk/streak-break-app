export default function Layout({ children }) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <main className="max-w-3xl mx-auto p-6">{children}</main>
      </div>
    );
  }
  