import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="py-10 px-4 max-w-3xl mx-auto space-y-6 text-white bg-zinc-950 min-h-[80vh]">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-5">
        <Shield className="h-6 w-6 text-amber-400" />
        <h1 className="text-2xl font-extrabold tracking-tight">Política de Cookies</h1>
      </div>

      <section className="space-y-4 text-sm text-zinc-300 leading-relaxed">
        <h2 className="text-base font-bold text-white mt-6">1. ¿Qué son las cookies?</h2>
        <p>Las cookies son pequeños archivos de texto que los sitios web almacenan en tu navegador para recopilar información sobre tu navegación y preferencias.</p>

        <h2 className="text-base font-bold text-white mt-6">2. Cookies que utilizamos</h2>
        <p>PollaMax utiliza las siguientes cookies:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento básico de la aplicación, como la autenticación con Firebase y el mantenimiento de la sesión iniciada.</li>
          <li><strong>Cookies de Firebase:</strong> Firebase Auth utiliza cookies y tokens de sesión para gestionar la autenticación de usuarios a través de Google.</li>
          <li><strong>Cookies de Vercel Analytics:</strong> Utilizamos Vercel Analytics para obtener estadísticas anónimas de uso de la aplicación. Estos datos nos ayudan a mejorar la experiencia del usuario.</li>
          <li><strong>sessionStorage:</strong> Almacenamos datos temporales en el almacenamiento de sesión del navegador para controlar animaciones (por ejemplo, la animación del podio solo se reproduce una vez por visita).</li>
        </ul>

        <h2 className="text-base font-bold text-white mt-6">3. Cookies de terceros</h2>
        <p>PollaMax puede cargar datos desde fuentes externas como OpenFootball API para obtener información de partidos en tiempo real. Estas fuentes pueden utilizar sus propias cookies según sus políticas individuales.</p>
        <p>Firebase, propiedad de Google LLC, gestiona la autenticación y el almacenamiento de datos. Puedes consultar la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Política de Privacidad de Google</a> para más información.</p>

        <h2 className="text-base font-bold text-white mt-6">4. Gestión de cookies</h2>
        <p>Puedes configurar tu navegador para rechazar todas las cookies o para indicar cuándo se envía una cookie. Sin embargo, algunas funciones de la aplicación podrían no funcionar correctamente sin cookies esenciales.</p>

        <h2 className="text-base font-bold text-white mt-6">5. Cambios en la política</h2>
        <p>Podemos actualizar esta política de cookies ocasionalmente. Te recomendamos revisar esta página periódicamente para estar informado de cualquier cambio.</p>

        <p className="text-zinc-500 text-xs mt-8">Última actualización: Junio 2026</p>
      </section>

      <div className="pt-6 border-t border-zinc-800">
        <Link href="/" className="text-sm text-emerald-400 hover:underline">&larr; Volver al inicio</Link>
      </div>
    </div>
  );
}
