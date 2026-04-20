import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useSorteoActivo } from "@/lib/useSorteoActivo";

const terms = [
  {
    title: "Duración",
    text: "El sorteo se realizará una vez se haya completado la venta total de los números disponibles para cada actividad.",
  },
  {
    title: "Participación",
    text: "Podrá participar cualquier persona que adquiera boletos dentro del período vigente del sorteo. Cada actividad contará con un mínimo de boletos requeridos por compra, el cual será previamente indicado en la plataforma.",
  },
  {
    title: "Asignación de números",
    text: "Los números serán asignados automáticamente por el sistema de manera única a cada participante una vez confirmada la compra.",
  },
  {
    title: "Selección de ganadores",
    text: "El ganador del premio principal será determinado en base a un resultado oficial de sorteo público nacional, utilizando las cifras correspondientes, lo cual garantiza un proceso transparente y verificable. Los premios instantáneos, como número de oro o premios especiales, serán entregados automáticamente a los participantes cuyos números coincidan con los números previamente definidos dentro de la actividad.",
  },
  {
    title: "Entrega de premios",
    text: "Los premios físicos serán entregados en la ciudad de Quito, previa coordinación con el ganador. Los premios en efectivo o instantáneos serán entregados mediante transferencia bancaria o medios digitales, una vez verificada la información del ganador.",
  },
  {
    title: "Notificación y difusión",
    text: "Los ganadores serán contactados mediante los datos registrados al momento de la compra. Además, los resultados y todas las actividades serán anunciados y difundidos a través de los canales oficiales y redes sociales de Grupo Barros.",
  },
  {
    title: "Transparencia",
    text: "Grupo Barros se compromete a garantizar la transparencia del proceso, mostrando evidencia del sorteo y la entrega de los premios.",
  },
  {
    title: "Condición del sorteo",
    text: "El sorteo del premio principal se realizará únicamente cuando se haya alcanzado el 100% de los boletos disponibles.",
  },
  {
    title: "Uso de imagen",
    text: "El ganador acepta que podrá ser grabado o fotografiado durante la entrega del premio, con fines promocionales.",
  },
  {
    title: "Pagos",
    text: "Las compras realizadas no son reembolsables. En caso de pagos por transferencia, el participante deberá enviar su comprobante dentro del tiempo establecido para validar su participación.",
  },
  {
    title: "Responsabilidad",
    text: "Grupo Barros no se hace responsable por errores en los datos ingresados por el participante al momento de la compra.",
  },
  {
    title: "Aceptación",
    text: "La participación en cualquier actividad implica la aceptación total de estos términos y condiciones.",
  },
];

const Terms = () => {
  const { data, loading } = useSorteoActivo();

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar sorteoData={data} loading={loading} />

      <section className="relative overflow-hidden pt-40 pb-20 sm:pt-48 sm:pb-28">
        <div className="absolute inset-0 bg-gradient-radial-gold opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background to-background" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-secondary/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              <ShieldCheck className="h-4 w-4" />
              Grupo Barros
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
              Términos y <span className="text-gold-gradient">Condiciones</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg">
              Reglas aplicables para la participación en actividades, sorteos, asignación de números y entrega de premios.
            </p>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4">
            {terms.map((term, index) => (
              <motion.article
                key={term.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.25) }}
                className="rounded-lg border border-border bg-card/75 p-5 backdrop-blur-xl transition-colors hover:border-primary/40 sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-gradient font-display text-lg font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-gold-gradient">{term.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base">{term.text}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 px-7 py-4 font-semibold text-foreground transition-all hover:border-primary hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 text-primary" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Terms;
