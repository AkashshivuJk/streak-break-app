export default function BentoCard({ title, description, onClick }) {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 hover:scale-105 transition-transform shadow-lg"
      >
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    );
  }
  