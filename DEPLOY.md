# Deploy — grupobarros.com.ec

## Requisitos del VPS
- Ubuntu 22.04 LTS (recomendado)
- Docker instalado
- Puerto 80 y 443 abiertos en el firewall
- DNS del dominio apuntando a la IP del VPS (`A record: grupobarros.com.ec → IP_DEL_VPS`)

---

## 1. Subir el proyecto al servidor

```bash
# Opción A: desde tu máquina local (recomendado)
scp -r /ruta/local/grupobarros root@IP_DEL_VPS:/opt/grupobarros

# Opción B: clonar desde git
ssh root@IP_DEL_VPS
git clone https://tu-repo.git /opt/grupobarros
```

---

## 2. Configurar variables de entorno

```bash
ssh root@IP_DEL_VPS
cd /opt/grupobarros

# Copiar el template de producción
cp backend/.env.prod backend/.env

# Editar con los valores reales
nano backend/.env
```

**Valores que DEBES cambiar en `.env`:**
| Variable | Qué poner |
|---|---|
| `DB_PASSWORD` | Contraseña segura para PostgreSQL |
| `JWT_SECRET` | String random de 64 chars (`openssl rand -hex 32`) |
| `ADMIN_PASSWORD` | Contraseña del panel admin |
| `EMAIL_PASSWORD` | Password de tu cuenta SMTP |
| `SMTP_SERVER` | Servidor SMTP (ej: `smtp.gmail.com`) |

---

## 3. Ejecutar el deploy

```bash
cd /opt/grupobarros
bash deploy.sh
```

El script hace automáticamente:
1. Instala Nginx y Certbot en el host
2. Configura Nginx con HTTP temporalmente
3. **Obtiene el certificado SSL con Let's Encrypt**
4. Activa Nginx con HTTPS completo
5. Configura renovación automática del certificado (cron)
6. Construye las imágenes Docker
7. Levanta todos los contenedores
8. Ejecuta todas las migraciones de base de datos

---

## 4. Crear el usuario administrador

```bash
cd /opt/grupobarros
docker compose -f docker-compose.prod.yml exec backend node scripts/create-user.js
```

---

## Comandos útiles post-deploy

```bash
# Ver logs en tiempo real
docker compose -f docker-compose.prod.yml logs -f

# Ver logs solo del backend
docker compose -f docker-compose.prod.yml logs -f backend

# Reiniciar un servicio
docker compose -f docker-compose.prod.yml restart backend

# Parar todo
docker compose -f docker-compose.prod.yml down

# Re-deploy después de cambios de código
bash deploy.sh

# Renovar SSL manualmente (normalmente es automático)
certbot renew && systemctl reload nginx

# Ver estado de los contenedores
docker compose -f docker-compose.prod.yml ps
```

---

## Arquitectura en producción

```
Internet
    │
    ▼
Nginx (host) :80/:443  ← SSL/TLS con Let's Encrypt
    │
    ├─ /api/*  ──────────► backend (Docker) :3001
    ├─ /uploads/* ───────► backend (Docker) :3001
    └─ /* ───────────────► frontend (Docker) :8080
                                │
                                └─ PostgreSQL (Docker) :5432
```

Los contenedores **no exponen puertos públicos** — solo escuchan en `127.0.0.1`, accesibles únicamente desde Nginx en el mismo host.
