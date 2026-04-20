export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: 800 }}>
      <h1>GrupoBarros API</h1>

      <h2>Auth</h2>
      <ul>
        <li><code>POST /api/auth/login</code> — Login con correo y contraseña</li>
        <li><code>POST /api/auth/refresh</code> — Renovar access token</li>
        <li><code>POST /api/auth/logout</code> — Cerrar sesión</li>
        <li><code>GET  /api/auth/me</code> — Usuario autenticado</li>
      </ul>

      <h2>Sorteos</h2>
      <ul>
        <li><code>GET    /api/sorteos</code> — Listar sorteos (filtro: ?estado=DRAFT|ACTIVO|CERRADO)</li>
        <li><code>POST   /api/sorteos</code> — Crear sorteo en DRAFT</li>
        <li><code>GET    /api/sorteos/:id</code> — Obtener sorteo</li>
        <li><code>PATCH  /api/sorteos/:id</code> — Editar sorteo (solo DRAFT)</li>
        <li><code>POST   /api/sorteos/:id/publicar</code> — DRAFT → ACTIVO</li>
        <li><code>POST   /api/sorteos/:id/cerrar</code> — ACTIVO → CERRADO (manual)</li>
        <li><code>GET    /api/sorteos/:id/estadisticas</code> — Boletos vendidos / disponibles</li>
        <li><code>GET    /api/sorteos/:id/boletos</code> — Boletos del sorteo (paginado)</li>
        <li><code>POST   /api/sorteos/:id/ganador-mayor</code> — Marcar ganador premio mayor</li>
      </ul>

      <h2>Números Especiales</h2>
      <ul>
        <li><code>GET    /api/sorteos/:id/numeros-especiales</code> — Listar números especiales</li>
        <li><code>POST   /api/sorteos/:id/numeros-especiales</code> — Agregar número especial</li>
        <li><code>PATCH  /api/sorteos/:id/numeros-especiales/:neId</code> — Editar número especial</li>
        <li><code>DELETE /api/sorteos/:id/numeros-especiales/:neId</code> — Eliminar número especial</li>
        <li><code>POST   /api/numeros-especiales/:id/ganador</code> — Marcar ganador de número especial</li>
      </ul>

      <h2>Compras</h2>
      <ul>
        <li><code>POST /api/compras</code> — Comprar boletos (asignación aleatoria)</li>
        <li><code>GET  /api/compras?cedula=XXXXXXXXXX</code> — Compras por cédula</li>
        <li><code>GET  /api/compras/:id</code> — Detalle de compra</li>
      </ul>

      <h2>Boletos</h2>
      <ul>
        <li><code>GET /api/boletos?sorteoId=&amp;numero=</code> — Buscar boleto por número</li>
        <li><code>GET /api/boletos?sorteoId=&amp;page=&amp;limit=</code> — Listar boletos paginados</li>
      </ul>

      <h2>Email</h2>
      <ul>
        <li><code>POST /api/send-email</code> — Envío de correo de contacto</li>
      </ul>
    </main>
  )
}
