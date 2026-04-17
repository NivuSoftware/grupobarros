export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>GrupoBarros API</h1>
      <p>Endpoints disponibles:</p>
      <ul>
        <li><code>POST /api/send-email</code> — Envío de correo de contacto</li>
      </ul>
    </main>
  );
}
