import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="py-10 px-4 max-w-3xl mx-auto space-y-6 text-white bg-zinc-950 min-h-[80vh]">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-5">
        <ShieldCheck className="h-6 w-6 text-emerald-400" />
        <h1 className="text-2xl font-extrabold tracking-tight">Términos y Condiciones</h1>
      </div>

      <section className="space-y-4 text-sm text-zinc-300 leading-relaxed">
        <h2 className="text-base font-bold text-white mt-6">1. Aceptación de los términos</h2>
        <p>Al acceder y utilizar PollaMax (&quot;la aplicación&quot;), aceptas cumplir con estos Términos y Condiciones. Si no estás de acuerdo, no debes usar la aplicación.</p>

        <h2 className="text-base font-bold text-white mt-6">2. Descripción del servicio</h2>
        <p>PollaMax es una plataforma de pronósticos deportivos familiar donde los usuarios pueden predecir resultados de partidos del Mundial de Fútbol, acumular puntos según sus aciertos y competir en un ranking interno. El servicio se ofrece &quot;tal cual&quot; y puede modificarse en cualquier momento.</p>

        <h2 className="text-base font-bold text-white mt-6">3. Registro y cuenta</h2>
        <p>Para usar la plataforma debes iniciar sesión con tu cuenta de Google. Eres responsable de mantener la confidencialidad de tu cuenta y de toda actividad realizada bajo ella. La aplicación no almacena contraseñas; la autenticación es gestionada enteramente por Google.</p>

        <h2 className="text-base font-bold text-white mt-6">4. Uso permitido</h2>
        <p>Te comprometes a usar la aplicación solo para fines legales y de acuerdo con estos términos. No debes manipular puntuaciones, crear múltiples cuentas, o realizar cualquier actividad que pueda perjudicar la integridad del juego.</p>

        <h2 className="text-base font-bold text-white mt-6">5. Puntuaciones y premios</h2>
        <p>Las puntuaciones se calculan automáticamente según las reglas publicadas en la plataforma. Los puntos son puramente simbólicos dentro del entorno familiar. No existe valor monetario real asociado a los puntos acumulados ni a las posiciones en el ranking.</p>

        <h2 className="text-base font-bold text-white mt-6">6. Propiedad intelectual</h2>
        <p>Todo el contenido de la aplicación, incluyendo el código, diseño, logotipos y marcas, es propiedad de los desarrolladores de PollaMax. No está permitida su reproducción sin autorización expresa.</p>

        <h2 className="text-base font-bold text-white mt-6">7. Limitación de responsabilidad</h2>
        <p>PollaMax no se hace responsable por daños directos o indirectos derivados del uso o la imposibilidad de uso de la plataforma. Los datos de partidos y resultados provienen de fuentes externas (OpenFootball) y pueden contener errores u omisiones.</p>

        <h2 className="text-base font-bold text-white mt-6">8. Modificaciones</h2>
        <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán publicados en esta página y entrarán en vigor inmediatamente después de su publicación.</p>

        <h2 className="text-base font-bold text-white mt-6">9. Contacto</h2>
        <p>Para cualquier consulta sobre estos términos, puedes contactarnos a través de los canales habilitados en la aplicación.</p>

        <p className="text-zinc-500 text-xs mt-8">Última actualización: Junio 2026</p>
      </section>

      <div className="pt-6 border-t border-zinc-800">
        <Link href="/" className="text-sm text-emerald-400 hover:underline">&larr; Volver al inicio</Link>
      </div>
    </div>
  );
}
