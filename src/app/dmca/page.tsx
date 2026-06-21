import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DmcaPage() {
  return (
    <div className="py-10 px-4 max-w-3xl mx-auto space-y-6 text-white bg-zinc-950 min-h-[80vh]">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-5">
        <AlertTriangle className="h-6 w-6 text-red-400" />
        <h1 className="text-2xl font-extrabold tracking-tight">DMCA y Terceros</h1>
      </div>

      <section className="space-y-4 text-sm text-zinc-300 leading-relaxed">
        <h2 className="text-base font-bold text-white mt-6">1. Contenido de terceros</h2>
        <p>PollaMax utiliza datos y servicios proporcionados por terceros para ofrecer su funcionalidad principal. Estos incluyen:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>OpenFootball API:</strong> Provee los datos de partidos, resultados, clasificaciones y estadísticas del Mundial de Fútbol. Los datos se muestran &quot;tal cual&quot; y pueden estar sujetos a los términos de uso de OpenFootball.</li>
          <li><strong>Firebase (Google):</strong> Plataforma de backend utilizada para autenticación de usuarios, almacenamiento en Firestore y hosting de funciones serverless.</li>
          <li><strong>Vercel:</strong> Plataforma de hosting y despliegue de la aplicación.</li>
          <li><strong>Iconos de Lucide React:</strong> Conjunto de iconos de código abierto utilizados en la interfaz de usuario.</li>
          <li><strong>Framer Motion:</strong> Biblioteca de animaciones para React.</li>
        </ul>

        <h2 className="text-base font-bold text-white mt-6">2. DMCA (Digital Millennium Copyright Act)</h2>
        <p>PollaMax respeta los derechos de propiedad intelectual de terceros. Si crees que algún contenido disponible en la aplicación infringe tus derechos de autor, por favor notifícalo a través de los canales de contacto proporcionados.</p>
        <p>Para presentar una notificación DMCA, incluye la siguiente información:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Identificación de la obra protegida que se alega infringida.</li>
          <li>Identificación del material infractor y su ubicación en la aplicación.</li>
          <li>Información de contacto suficiente para que podamos responderte.</li>
          <li>Una declaración de buena fe sobre el uso no autorizado del material.</li>
          <li>Una declaración, bajo pena de perjurio, de que la información es precisa y que eres el titular de los derechos o estás autorizado para actuar en su nombre.</li>
        </ul>

        <h2 className="text-base font-bold text-white mt-6">3. Exención de responsabilidad sobre datos de terceros</h2>
        <p>PollaMax no garantiza la exactitud, integridad o actualidad de los datos proporcionados por fuentes externas como OpenFootball. Los resultados y estadísticas de partidos se muestran con fines informativos y de entretenimiento familiar.</p>

        <h2 className="text-base font-bold text-white mt-6">4. Enlaces a sitios externos</h2>
        <p>La aplicación puede contener enlaces a sitios web externos (como Google, OpenFootball, etc.). No tenemos control sobre el contenido o las prácticas de privacidad de estos sitios y no asumimos responsabilidad por ellos.</p>

        <h2 className="text-base font-bold text-white mt-6">5. Licencias de código abierto</h2>
        <p>PollaMax utiliza diversas bibliotecas de código abierto bajo sus respectivas licencias (MIT, Apache 2.0, BSD, etc.). El código fuente de estas bibliotecas está disponible en los repositorios oficiales de cada proyecto.</p>

        <p className="text-zinc-500 text-xs mt-8">Última actualización: Junio 2026</p>
      </section>

      <div className="pt-6 border-t border-zinc-800">
        <Link href="/" className="text-sm text-emerald-400 hover:underline">&larr; Volver al inicio</Link>
      </div>
    </div>
  );
}
