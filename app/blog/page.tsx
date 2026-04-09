

export const metadata = {
  title: 'Blog | Paraiso Encantado',
  description: 'Lee historias, consejos y experiencias sobre la Huasteca Potosina.',
};

export default function BlogPage() {
  return (
    <main className="w-full">
      <section className="relative w-full h-80 md:h-96 bg-gradient-to-r from-selva to-jade flex items-center justify-center">
        <div className="absolute inset-0 bg-black/25"></div>
        <div className="relative z-10 text-center text-white">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Blog
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="font-display text-3xl text-selva mb-4">
              Próximamente
            </h2>
            <p className="font-body text-gray-700 mb-8">
              Estamos preparando historias, consejos y experiencias sobre la Huasteca Potosina.
            </p>
            <p className="font-body text-gray-600">
              Vuelve pronto para leer nuestras publicaciones.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
