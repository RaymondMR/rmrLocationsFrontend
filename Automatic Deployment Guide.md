# 🚀 Automatic Deployment Guide

## GitHub Actions + Docker + Traefik + NGINX

### Guía Completa de Despliegue Automático para Principiantes

> **¿Qué aprenderás?** Al final de esta guía sabrás cómo automatizar el despliegue de tu aplicación web: cada vez que hagas `git push`, tu app se actualizará sola en tu servidor VPS, con HTTPS incluido. ¡Cero intervención manual!

---

## 📖 Tabla de Contenidos

- [Conceptos Básicos](#-conceptos-básicos-antes-de-empezar)
- [Requisitos Previos](#-requisitos-previos)
- [Paso 1: Configurar tu VPS](#-paso-1-configurar-tu-vps)
- [Paso 2: Preparar tu Repositorio GitHub](#-paso-2-preparar-tu-repositorio-github)
- [Paso 3: Configurar GitHub Actions](#-paso-3-configurar-github-actions)
- [Paso 4: Crear Dockerfile](#-paso-4-crear-dockerfile)
- [Paso 5: Configurar Docker Compose](#-paso-5-configurar-docker-compose)
- [Paso 6: Configurar Traefik](#-paso-6-configurar-traefik)
- [Prueba Final](#-prueba-final)
- [Solución de Problemas](#-solución-de-problemas-comunes)

---

## 🧠 Conceptos Básicos (Antes de Empezar)

Si eres nuevo en DevOps, aquí tienes una mini-explicación de cada tecnología que usaremos:

| Tecnología | ¿Qué es? | Analogía Sencilla |
|---|---|---|
| **Docker** | Empaqueta tu aplicación en una "caja" que funciona igual en cualquier computadora | Como un contenedor de barco: tu app viaja segura dentro, sin importar dónde esté |
| **Docker Compose** | Orquesta varios contenedores Docker a la vez | Como un director de orquesta que coordina todos los músicos (contenedores) |
| **GitHub Actions** | Automatiza tareas cuando haces `git push` | Un robot que trabaja por ti cada vez que subes código |
| **Traefik** | Proxy inverso que redirige el tráfico web y gestiona SSL/HTTPS | El recepcionista de un edificio: recibe visitas y las guía al departamento correcto |
| **NGINX** | Servidor web rápido y ligero | El mesero que sirve tu página web a los visitantes |
| **VPS** | Servidor Virtual Privado (computadora en la nube 24/7) | Tu propia computadora siempre encendida en un data center |

### 🔄 El Flujo Completo (Así funciona el pipeline)

```
Tú escribes código → git push → GitHub Actions se activa
  → Construye imagen Docker → La sube a GitHub Container Registry
  → Se conecta por SSH a tu VPS → Descarga la nueva imagen
  → docker compose up -d (reinicia contenedores) → ¡App actualizada! 🎉
```

---

## 📋 Requisitos Previos

### En tu VPS Ubuntu (lo configuraremos en el Paso 1):
- Ubuntu 20.04, 22.04 o 24.04
- Docker y Docker Compose instalados
- SSH habilitado
- Acceso root o usuario con permisos sudo

### En tu Computadora Local:
- Git instalado → [Descargar Git](https://git-scm.com/downloads)
- Cuenta en GitHub → [Crear cuenta gratis](https://github.com/signup)
- SSH keys configuradas en GitHub → [Guía oficial](https://docs.github.com/es/authentication/connecting-to-github-with-ssh)

### Otros (Recomendados):
- Un dominio apuntando a tu VPS (ej: `miapp.com` → IP del VPS)
- Una cuenta en DockerHub o usar GitHub Container Registry (gratis)

> 📺 **Video recomendado — DevOps para principiantes:**
> [¿Qué es DevOps? Explicado en 10 minutos](https://www.youtube.com/results?search_query=que+es+devops+explicado+principiantes+espa%C3%B1ol)

---

## 🖥️ Paso 1: Configurar tu VPS

> **Objetivo:** Dejar tu servidor listo con Docker, un usuario seguro para despliegues, y las llaves SSH necesarias.

### 1.1 Conectarse al VPS

Abre tu terminal y conéctate:

```bash
ssh root@TU_IP_DEL_VPS
```

> 💡 **Tip:** Reemplaza `TU_IP_DEL_VPS` con la IP real de tu servidor. Si contrataste un VPS en DigitalOcean, Hetzner, Linode o similar, la IP viene en el panel de control.

### 1.2 Actualizar el Sistema

Siempre empieza con el sistema actualizado:

```bash
apt update && apt upgrade -y
```

### 1.3 Instalar Docker

Docker es el motor de contenedores. Usamos el script oficial para instalarlo correctamente:

```bash
# Descargar el script oficial de instalación
curl -fsSL https://get.docker.com -o get-docker.sh

# Ejecutar el instalador
sudo sh get-docker.sh

# Agregar tu usuario al grupo docker (para usar docker sin sudo)
sudo usermod -aG docker $USER

# Activar los cambios de grupo sin cerrar sesión
newgrp docker

# Verificar que Docker funciona
docker --version
docker run hello-world
```

> 📝 **Explicación:** `usermod -aG docker $USER` te agrega al grupo `docker` para que no tengas que escribir `sudo` antes de cada comando docker. `newgrp docker` aplica el cambio sin necesidad de cerrar y volver a abrir sesión.

### 1.4 Instalar Docker Compose

Docker Compose permite definir y ejecutar aplicaciones multi-contenedor con un solo archivo YAML:

```bash
# Descargar la última versión de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker-compose --version
```

> 💡 **Nota importante:** En versiones modernas de Docker, Compose viene integrado como `docker compose` (sin guión). Puedes usar ambos. En esta guía usaremos `docker compose` (con espacio, la versión integrada).

### 1.5 Crear Directorio del Proyecto

Organiza tus aplicaciones en una estructura clara:

```bash
# Crear carpeta para las aplicaciones
mkdir -p /home/apps/mi-app

# Entrar en ella
cd /home/apps/mi-app
```

> 📝 **Convención:** Guarda cada proyecto en `/home/apps/nombre-del-proyecto`. Esto mantiene todo organizado cuando tengas múltiples aplicaciones.

### 1.6 Crear Usuario de Despliegue (IMPORTANTE PARA SEGURIDAD)

Nunca uses `root` para despliegues automáticos. Crea un usuario dedicado con permisos mínimos:

```bash
# Crear usuario 'deploy' con directorio home
sudo useradd -m -s /bin/bash deploy

# Agregar al grupo docker (para manejar contenedores)
sudo usermod -aG docker deploy

# Permitir que 'deploy' ejecute docker sin contraseña
echo 'deploy ALL=(ALL) NOPASSWD: /usr/bin/docker' | sudo tee /etc/sudoers.d/deploy-docker

# Verificar que el archivo sudoers se creó bien
sudo visudo -c -f /etc/sudoers.d/deploy-docker
```

> 🔒 **¿Por qué esto es importante?** Si alguien obtuviera acceso a tu pipeline de CI/CD, solo podría ejecutar comandos docker, no borrar todo el servidor. Es el principio de "mínimo privilegio".

### 1.7 Generar Llave SSH para GitHub Actions

GitHub Actions necesita conectarse a tu VPS de forma segura. Para eso generamos un par de llaves SSH:

```bash
# Cambiar al usuario deploy
sudo su - deploy

# Generar par de llaves SSH tipo ed25519 (más seguro que RSA)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""

# Ver la llave pública (esta va al VPS)
cat ~/.ssh/github_actions.pub

# Agregar la llave pública a authorized_keys (PERMITE LA CONEXIÓN)
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Establecer permisos correctos (MUY IMPORTANTE)
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions

# Mostrar la llave privada (esta va a GitHub Secrets, ¡ES SECRETA!)
cat ~/.ssh/github_actions
```

> ⚠️ **CRÍTICO:** La llave privada (el contenido de `github_actions`) es un secreto. La guardarás en GitHub Secrets en el Paso 2. ¡Nunca la compartas ni la subas a tu repositorio!

### 1.8 Configurar Firewall (UFW)

Protege tu servidor permitiendo solo el tráfico necesario:

```bash
# Salir del usuario deploy si estás dentro
exit

# Permitir SSH (puerto 22)
sudo ufw allow 22/tcp

# Permitir HTTP (puerto 80)
sudo ufw allow 80/tcp

# Permitir HTTPS (puerto 443)
sudo ufw allow 443/tcp

# Activar el firewall
sudo ufw enable

# Verificar estado
sudo ufw status verbose
```

> 📝 **Explicación:** Solo abrimos los puertos 22 (SSH para conectarnos), 80 (HTTP) y 443 (HTTPS). Traefik escuchará en 80 y 443 para recibir el tráfico web.

### 📺 Videos Recomendados para el Paso 1

| Video | Contenido |
|---|---|
| [Curso Docker Completo en Español (Playlist)](https://youtube.com/playlist?list=PLu_htiBDhr8EpdB_xYvWGceFVpWGK8DkR) | Docker desde cero: instalación, imágenes, contenedores, volúmenes |
| [Cómo instalar Docker en Ubuntu (YouTube)](https://www.youtube.com/results?search_query=instalar+docker+ubuntu+VPS+2024) | Búsqueda de tutoriales actualizados |
| [SSH y Llaves SSH explicado fácil](https://www.youtube.com/results?search_query=ssh+llaves+github+explicado+principiantes+espa%C3%B1ol) | Guía visual de SSH keys |

---

## 📦 Paso 2: Preparar tu Repositorio GitHub

> **Objetivo:** Crear la estructura de archivos de tu proyecto y configurar los secretos en GitHub.

### 2.1 Crear la Estructura del Repositorio

En tu computadora local, crea un proyecto con esta estructura:

```
mi-app/
├── .github/
│   └── workflows/
│       └── deploy.yml            ← GitHub Actions workflow (Paso 3)
├── src/
│   └── index.html                ← Tu aplicación (ejemplo con HTML estático)
├── nginx/
│   └── nginx.conf                ← Configuración de NGINX (Paso 6)
├── Dockerfile                     ← Cómo construir la imagen (Paso 4)
├── docker-compose.yml             ← Orquestación de contenedores (Paso 5)
├── .dockerignore                  ← Archivos que Docker debe ignorar
├── .gitignore                     ← Archivos que Git debe ignorar
└── README.md                      ← Documentación de tu proyecto
```

Crea las carpetas desde tu terminal local:

```bash
mkdir -p mi-app/.github/workflows mi-app/src mi-app/nginx
cd mi-app
git init
```

### 2.2 Crear `.gitignore`

Este archivo le dice a Git qué archivos NO debe subir al repositorio:

```bash
# .gitignore — Archivos que Git debe ignorar

# Dependencias
node_modules/

# Archivos de entorno (contienen secretos, NUNCA se suben)
.env
.env.local
.env.production

# Archivos del sistema operativo
.DS_Store
Thumbs.db

# Archivos de IDE
.vscode/
.idea/

# Docker (no subir datos volátiles)
docker-compose.override.yml

# Logs
*.log

# SSL/TLS (los gestiona Traefik automáticamente)
certs/
acme.json
```

### 2.3 Crear `.dockerignore`

Este archivo le dice a Docker qué archivos NO incluir en la imagen (hace el build más rápido y la imagen más pequeña):

```bash
# .dockerignore — Archivos que Docker debe ignorar al construir la imagen

# Dependencias
node_modules/

# Git
.git/
.gitignore

# Documentación
README.md
*.md

# Docker
Dockerfile
docker-compose.yml
.dockerignore

# Archivos de entorno
.env
.env.*

# IDE
.vscode/
.idea/

# Logs y temporales
*.log
tmp/
```

### 2.4 Crear una Aplicación de Ejemplo

Para esta guía usaremos una página web estática simple servida con NGINX. Crea `src/index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi App — ¡Desplegada Automáticamente! 🚀</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 { font-size: 3rem; margin-bottom: 0.5rem; }
        p { font-size: 1.2rem; opacity: 0.9; }
        .badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ¡Funciona!</h1>
        <p>Tu aplicación se desplegó automáticamente con GitHub Actions + Docker + Traefik</p>
        <div class="badge">HTTPS seguro ✅</div>
    </div>
</body>
</html>
```

### 2.5 Configurar los Secretos en GitHub

Los secretos son variables encriptadas que GitHub Actions usará para conectarse a tu VPS. **Nunca** los escribas directamente en el código.

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**
4. Agrega estos 4 secretos uno por uno:

| Nombre del Secreto | Valor | Descripción |
|---|---|---|
| `SSH_HOST` | `123.45.67.89` | La dirección IP de tu VPS |
| `SSH_USERNAME` | `deploy` | El usuario que creaste en el Paso 1.6 |
| `SSH_PRIVATE_KEY` | *(contenido COMPLETO de `~/.ssh/github_actions`)* | La llave privada que generaste en Paso 1.7 |
| `WORK_DIR` | `/home/apps/mi-app` | Directorio donde vive tu app en el VPS |

> ⚠️ **Atención con SSH_PRIVATE_KEY:** Copia TODO el contenido de la llave privada, incluyendo las líneas `-----BEGIN OPENSSH PRIVATE KEY-----` y `-----END OPENSSH PRIVATE KEY-----`. Sin saltos de línea extra.

Se verá así en GitHub:

```
SSH_HOST = 123.45.67.89
SSH_USERNAME = deploy
SSH_PRIVATE_KEY = -----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
... (muchas líneas) ...
-----END OPENSSH PRIVATE KEY-----
WORK_DIR = /home/apps/mi-app
```

### 2.6 Hacer el Primer Commit y Push

```bash
# Agregar todos los archivos
git add .

# Crear el primer commit
git commit -m "feat: estructura inicial del proyecto"

# Conectar con GitHub (reemplaza con tu usuario y repo)
git remote add origin git@github.com:TU_USUARIO/TU_REPO.git

# Subir los cambios
git branch -M main
git push -u origin main
```

### 📺 Videos Recomendados para el Paso 2

| Video | Contenido |
|---|---|
| [Git y GitHub para principiantes](https://www.youtube.com/results?search_query=git+github+principiantes+tutorial+espa%C3%B1ol) | Desde cero: git init, commit, push, ramas |
| [GitHub Secrets explicados](https://www.youtube.com/results?search_query=github+secrets+actions+explicado+espa%C3%B1ol) | Cómo funcionan los secretos en GitHub Actions |
| [Curso de Git desde Cero (midulive)](https://www.youtube.com/results?search_query=midulive+git+github+tutorial) | Tutorial completo de Git |

---

## ⚙️ Paso 3: Configurar GitHub Actions

> **Objetivo:** Crear el workflow que automatiza TODO el despliegue cada vez que haces `git push`.

### 3.1 ¿Qué es un Workflow de GitHub Actions?

Un **workflow** es un archivo YAML que define una serie de pasos automáticos. Se guarda en `.github/workflows/` y GitHub lo ejecuta cuando ocurre un evento (como un push).

**Nuestro workflow hará esto automáticamente:**
1. Se activa cuando haces push a la rama `main`
2. Descarga tu código
3. Construye una imagen Docker
4. La sube a GitHub Container Registry (GHCR)
5. Se conecta por SSH a tu VPS
6. Descarga la nueva imagen y reinicia los contenedores

### 3.2 Crear el Workflow

Crea el archivo `.github/workflows/deploy.yml`:

```yaml
# .github/workflows/deploy.yml
# Workflow de despliegue automático: construye imagen Docker y la despliega en VPS

name: 🚀 Deploy to VPS

# Cuándo se activa este workflow
on:
  push:
    branches:
      - main          # Solo cuando se hace push a la rama principal
  workflow_dispatch:   # Permite ejecutarlo manualmente desde GitHub

# Variables de entorno disponibles en todo el workflow
env:
  REGISTRY: ghcr.io                    # GitHub Container Registry
  IMAGE_NAME: ${{ github.repository }} # nombre-de-usuario/nombre-de-repo

jobs:
  build-and-deploy:
    name: 📦 Construir y Desplegar
    runs-on: ubuntu-latest             # Máquina virtual donde se ejecuta

    # Permisos necesarios para GitHub Container Registry
    permissions:
      contents: read
      packages: write

    steps:
      # =============================================
      # Paso 1: Descargar el código del repositorio
      # =============================================
      - name: 📥 Descargar código
        uses: actions/checkout@v4

      # =============================================
      # Paso 2: Iniciar sesión en GitHub Container Registry
      # =============================================
      - name: 🔐 Login a GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # =============================================
      # Paso 3: Construir y subir la imagen Docker
      # =============================================
      - name: 🏗️ Construir y subir imagen Docker
        uses: docker/build-push-action@v6
        with:
          context: .                        # Directorio donde está el Dockerfile
          push: true                        # Subir la imagen al registry
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      # =============================================
      # Paso 4: Desplegar en el VPS por SSH
      # =============================================
      - name: 🚀 Desplegar en VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            # Entrar al directorio del proyecto
            cd ${{ secrets.WORK_DIR }}

            # Descargar la última imagen desde GHCR
            echo "📥 Descargando nueva imagen..."
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            docker compose pull

            # Reiniciar los contenedores con la nueva imagen
            echo "🔄 Reiniciando contenedores..."
            docker compose up -d --remove-orphans

            # Limpiar imágenes viejas (ahorra espacio en disco)
            echo "🧹 Limpiando imágenes antiguas..."
            docker image prune -f

            echo "✅ ¡Despliegue completado!"
```

> 📝 **Explicación línea por línea:**
> - `on: push: branches: [main]` → Solo se activa en pushes a main. Los pushes a otras ramas no disparan el despliegue.
> - `workflow_dispatch` → Agrega un botón "Run workflow" en GitHub para ejecutarlo manualmente.
> - `runs-on: ubuntu-latest` → GitHub nos presta una máquina virtual Ubuntu gratuita.
> - `docker/build-push-action@v6` → Construye la imagen Y la sube en un solo paso. Etiquetamos con `latest` y el SHA del commit.
> - `appleboy/ssh-action@v1` → Se conecta por SSH y ejecuta comandos en el VPS.
> - `docker compose up -d` → `-d` significa "detached" (en segundo plano). `--remove-orphans` limpia contenedores huérfanos.
> - `docker image prune -f` → Borra imágenes viejas que ya no se usan para liberar espacio.

### 3.3 Subir el Workflow a GitHub

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: agregar workflow de despliegue automático"
git push
```

> 💡 **Tip:** Después de este push, el workflow se ejecutará automáticamente. Puedes ver su progreso en tu repositorio → pestaña **Actions**.

### 📺 Videos Recomendados para el Paso 3

| Video | Contenido |
|---|---|
| [Build Real-World CI/CD Pipeline (Docker + GitHub Actions)](https://youtu.be/WwxSNIrW8bk) | Pipeline completo paso a paso (inglés con subtítulos) |
| [GitHub Actions para principiantes](https://www.youtube.com/results?search_query=github+actions+principiantes+tutorial+espa%C3%B1ol) | Tutoriales en español sobre GitHub Actions |
| [Desplegar con SSH en GitHub Actions](https://www.youtube.com/results?search_query=github+actions+ssh+deploy+docker+VPS) | Conexión SSH desde GitHub Actions |

---

## 🐳 Paso 4: Crear el Dockerfile

> **Objetivo:** Definir cómo se construye la imagen Docker de tu aplicación.

### 4.1 ¿Qué es un Dockerfile?

Un **Dockerfile** es una receta que le dice a Docker cómo construir tu aplicación paso a paso. Es como una lista de instrucciones: "usa esta base, copia estos archivos, ejecuta este comando..."

Cada instrucción crea una **capa** (layer). Docker cachea las capas para que los builds posteriores sean más rápidos.

### 4.2 Dockerfile Multi-Etapa (Multi-Stage)

Usamos **multi-stage build** para mantener la imagen final pequeña y segura:

```dockerfile
# Dockerfile
# Multi-stage build: construye en una etapa, empaqueta solo lo necesario en otra

# =============================================
# ETAPA 1: BUILD (construcción)
# Solo se usa para compilar/preparar archivos
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias primero (mejor caching)
COPY package*.json ./
RUN npm ci --only=production

# Copiar el código fuente y construir
COPY src/ ./src/
# Si tuvieras un paso de build (React, Vue, etc.):
# RUN npm run build

# =============================================
# ETAPA 2: PRODUCTION (imagen final)
# Solo incluye lo necesario para ejecutar
# =============================================
FROM nginx:1.27-alpine

# Copiar archivos estáticos a la carpeta que NGINX sirve
COPY src/ /usr/share/nginx/html/

# Copiar configuración personalizada de NGINX
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# NGINX expone el puerto 80 por defecto
EXPOSE 80

# NGINX ya tiene su propio HEALTHCHECK integrado
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# NGINX ya incluye CMD para iniciar, no es necesario definirlo
```

> 📝 **Explicación:**
> - **`FROM nginx:1.27-alpine`** → Usamos NGINX Alpine (solo ~5MB) como base. Alpine es una versión ultra-ligera de Linux.
> - **`alpine`** → Las imágenes Alpine son mucho más pequeñas que las normales (~5MB vs ~180MB). Menos tamaño = despliegues más rápidos y menos superficie de ataque.
> - **`EXPOSE 80`** → Documenta que el contenedor escucha en el puerto 80. No abre el puerto realmente, es informativo.
> - **`HEALTHCHECK`** → Docker verifica periódicamente que la app esté viva. Si falla, Docker la marca como "unhealthy".
> - **Multi-stage:** Aunque aquí solo copiamos archivos estáticos, el patrón multi-stage brilla con apps que necesitan compilación (React, Next.js, Go, etc.).

### 4.3 Dockerfile para Aplicaciones Node.js (Ejemplo Alternativo)

Si tu app no es estática sino una API Node.js, usa este Dockerfile en su lugar:

```dockerfile
# Dockerfile para aplicación Node.js con multi-stage build

# =============================================
# ETAPA 1: BUILD
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias (capa cacheable)
COPY package*.json ./
RUN npm ci --only=production

# =============================================
# ETAPA 2: PRODUCTION
# =============================================
FROM node:20-alpine

WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar solo dependencias de producción desde la etapa build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copiar el código fuente
COPY src/ ./src/

# Cambiar a usuario no-root (seguridad)
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
```

> 🔒 **Buenas prácticas de seguridad aplicadas:**
> 1. **Multi-stage build** → La imagen final no incluye herramientas de build
> 2. **Usuario no-root** → El contenedor no corre como `root`, reduciendo riesgos
> 3. **Alpine** → Imagen base mínima
> 4. **HEALTHCHECK** → Detección temprana de fallos
> 5. **`.dockerignore`** → No se copian archivos innecesarios a la imagen

### 📺 Videos Recomendados para el Paso 4

| Video | Contenido |
|---|---|
| [Escribir Dockerfiles efectivos](https://www.youtube.com/results?search_query=dockerfile+tutorial+paso+a+paso+espa%C3%B1ol) | Tutorial paso a paso de Dockerfiles |
| [Multi-stage builds explicados](https://www.youtube.com/results?search_query=docker+multi+stage+build+explicado) | Cómo reducir el tamaño de tus imágenes |
| [Mejores prácticas Dockerfile (inglés)](https://www.youtube.com/results?search_query=dockerfile+best+practices+production) | Optimización y seguridad en Dockerfiles |

---

## 🎼 Paso 5: Configurar Docker Compose

> **Objetivo:** Definir tu aplicación y Traefik como servicios que Docker Compose orquesta juntos.

### 5.1 ¿Qué es Docker Compose?

**Docker Compose** te permite definir múltiples contenedores y su configuración en un solo archivo `docker-compose.yml`. Con un solo comando (`docker compose up -d`) levantas toda tu infraestructura.

### 5.2 Crear `docker-compose.yml`

```yaml
# docker-compose.yml
# Orquestación de servicios: Traefik (proxy) + NGINX (app web)

version: "3.8"

# =============================================
# SERVICIOS
# =============================================
services:

  # -------------------------------------------
  # Traefik — Proxy inverso y SSL automático
  # -------------------------------------------
  traefik:
    image: traefik:v3.2
    container_name: traefik
    restart: unless-stopped
    command:
      # Activar dashboard (solo para debug, en producción desactivar)
      - "--api.dashboard=true"
      # Proveedores de configuración
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"      # Solo exponer lo que activemos
      - "--providers.docker.network=traefik-public"       # Red que Traefik monitorea
      # Puntos de entrada (puertos)
      - "--entrypoints.web.address=:80"                   # HTTP
      - "--entrypoints.websecure.address=:443"            # HTTPS
      # Redirección automática HTTP → HTTPS
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      # Let's Encrypt (SSL automático y gratuito)
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=${LETSENCRYPT_EMAIL:-admin@example.com}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      # Logging
      - "--log.level=INFO"
      - "--accesslog=true"
    ports:
      - "80:80"         # HTTP
      - "443:443"       # HTTPS
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"    # Permite a Traefik ver otros contenedores
      - "traefik-certificates:/letsencrypt"                # Almacenar certificados SSL
    networks:
      - traefik-public
    labels:
      # Dashboard de Traefik con autenticación básica
      - "traefik.enable=true"
      - "traefik.http.routers.traefik-dashboard.rule=Host(`traefik.${DOMAIN:-localhost}`)"
      - "traefik.http.routers.traefik-dashboard.service=api@internal"
      - "traefik.http.routers.traefik-dashboard.entrypoints=websecure"
      - "traefik.http.routers.traefik-dashboard.tls=true"
      - "traefik.http.routers.traefik-dashboard.tls.certresolver=letsencrypt"
      # Autenticación básica para proteger el dashboard
      # Genera las credenciales con: echo $(htpasswd -nb admin contraseña) | sed -e s/\\$/\\$\\$/g
      - "traefik.http.routers.traefik-dashboard.middlewares=traefik-auth"
      - "traefik.http.middlewares.traefik-auth.basicauth.users=${TRAEFIK_AUTH_USERS:-admin:$$apr1$$xT6aHO5r$$9Qhrm.YbFjKEudvgU5aRg0}"

  # -------------------------------------------
  # NGINX — Tu aplicación web
  # -------------------------------------------
  nginx:
    image: ghcr.io/TU_USUARIO/TU_REPO:latest    # Imagen desde GitHub Container Registry
    container_name: mi-app-nginx
    restart: unless-stopped
    networks:
      - traefik-public
    labels:
      # Activar Traefik para este contenedor
      - "traefik.enable=true"

      # Router: define cómo llegar a esta app
      - "traefik.http.routers.mi-app.rule=Host(`${DOMAIN:-localhost}`)"
      - "traefik.http.routers.mi-app.entrypoints=websecure"
      - "traefik.http.routers.mi-app.tls=true"
      - "traefik.http.routers.mi-app.tls.certresolver=letsencrypt"

      # Servicio: el puerto interno del contenedor
      - "traefik.http.services.mi-app.loadbalancer.server.port=80"

      # Middlewares (opcionales pero recomendados)
      - "traefik.http.routers.mi-app.middlewares=mi-app-headers@docker"
      - "traefik.http.middlewares.mi-app-headers.headers.customresponseheaders.X-Content-Type-Options=nosniff"
      - "traefik.http.middlewares.mi-app-headers.headers.customresponseheaders.X-Frame-Options=DENY"
      - "traefik.http.middlewares.mi-app-headers.headers.customresponseheaders.X-XSS-Protection=1;mode=block"

# =============================================
# REDES
# =============================================
networks:
  traefik-public:
    name: traefik-public
    external: false     # Docker Compose la crea si no existe

# =============================================
# VOLÚMENES
# =============================================
volumes:
  traefik-certificates:
    name: traefik-certificates
```

> 📝 **Explicación de las partes clave:**
>
> **Labels de Traefik** → Son etiquetas que Traefik lee para configurar automáticamente el enrutamiento. No necesitas tocar archivos de configuración de Traefik; todo se configura aquí.
>
> **`traefik.http.routers.mi-app.rule=Host(...)`** → "Cuando llegue una petición a este dominio, envíala a este contenedor".
>
> **`tls.certresolver=letsencrypt`** → "Genera un certificado SSL gratuito con Let's Encrypt para este dominio".
>
> **`restart: unless-stopped`** → Si el contenedor se cae, Docker lo reinicia automáticamente. Solo se detiene si tú lo haces manualmente.

### 5.3 Crear Archivo `.env` en el VPS

Crea el archivo `.env` directamente en tu VPS (NUNCA en el repositorio):

```bash
# Conéctate al VPS
ssh root@TU_IP_DEL_VPS

# Crear archivo .env en el directorio del proyecto
cd /home/apps/mi-app
nano .env
```

Contenido del archivo `.env`:

```bash
# .env — Variables de entorno para Docker Compose
# Este archivo SOLO existe en el VPS, NUNCA se sube a GitHub

# Tu dominio (sin https:// ni www)
DOMAIN=miapp.com

# Email para Let's Encrypt (recibirás avisos de expiración de certificados)
LETSENCRYPT_EMAIL=tu-email@example.com

# Credenciales para el dashboard de Traefik
# Genera la contraseña con: htpasswd -nb admin TU_CONTRASEÑA
# Por defecto: admin / admin (¡CÁMBIALA EN PRODUCCIÓN!)
TRAEFIK_AUTH_USERS=admin:$$apr1$$xT6aHO5r$$9Qhrm.YbFjKEudvgU5aRg0
```

> 🔒 **Seguridad:** El archivo `.env` contiene configuraciones sensibles. Por eso está en el `.gitignore` y solo existe en el VPS. Si usas un dominio, Let's Encrypt te dará HTTPS gratis y automático. Si no tienes dominio, puedes usar la IP del VPS (pero no tendrás HTTPS).

### 5.4 Configuración Inicial en el VPS

Antes del primer despliegue, necesitas preparar el VPS manualmente una sola vez:

```bash
# Conectarse al VPS
ssh root@TU_IP_DEL_VPS

# Ir al directorio del proyecto
cd /home/apps/mi-app

# Crear la red de Traefik si no existe
docker network create traefik-public 2>/dev/null || true

# Crear el archivo acme.json para los certificados SSL
# (Debe tener permisos 600 o Traefik se queja)
touch acme.json
chmod 600 acme.json

# Iniciar solo Traefik por primera vez para probar
docker compose up -d traefik

# Verificar que Traefik está corriendo
docker compose ps
docker compose logs traefik
```

### 📺 Videos Recomendados para el Paso 5

| Video | Contenido |
|---|---|
| [Curso Docker Compose (mismo playlist Docker)](https://youtube.com/playlist?list=PLu_htiBDhr8EpdB_xYvWGceFVpWGK8DkR) | Unidad 6 del curso: Docker Compose a fondo |
| [Docker Compose en producción](https://www.youtube.com/results?search_query=docker+compose+produccion+nginx+guia+completa) | Guías de Docker Compose para producción |
| [Variables de entorno en Docker](https://www.youtube.com/results?search_query=docker+compose+variables+entorno+env+file) | Buenas prácticas con .env y Docker |

---

## 🔀 Paso 6: Configurar Traefik

> **Objetivo:** Configurar el proxy inverso que maneja el tráfico entrante, los certificados SSL y el enrutamiento hacia tu aplicación.

### 6.1 ¿Qué es Traefik y por qué lo usamos?

**Traefik** es un proxy inverso moderno diseñado específicamente para contenedores. A diferencia de NGINX tradicional:

| Característica | Traefik | NGINX tradicional |
|---|---|---|
| Descubre contenedores | ✅ **Automático** (lee labels de Docker) | ❌ Manual (editar archivos .conf) |
| SSL / Let's Encrypt | ✅ Automático | ❌ Requiere Certbot o configuración manual |
| Recarga en caliente | ✅ Sin reiniciar | ❌ Requiere `nginx -s reload` |
| Dashboard web | ✅ Integrado | ❌ No tiene |
| Métricas | ✅ Integradas (Prometheus) | ❌ Requiere módulo extra |

### 6.2 Crear Configuración de NGINX

Traefik se encarga del SSL y enrutamiento externo. NGINX solo sirve tu aplicación. Crea `nginx/nginx.conf`:

```nginx
# nginx/nginx.conf
# Configuración de NGINX para servir aplicación web estática

server {
    listen 80;
    server_name _;          # Acepta cualquier dominio (Traefik ya filtró)

    root /usr/share/nginx/html;
    index index.html;

    # Cabeceras de seguridad
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Comprimir respuestas para mejor rendimiento
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;

    # Página principal
    location / {
        try_files $uri $uri/ =404;
    }

    # Cache de archivos estáticos (30 días)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Denegar acceso a archivos ocultos
    location ~ /\. {
        deny all;
        return 404;
    }
}
```

> 📝 **Explicación de la configuración:**
> - **`server_name _;`** → Acepta cualquier nombre de dominio. Traefik ya se encargó de verificar que el dominio sea el correcto antes de enviar la petición aquí.
> - **`gzip on;`** → Comprime las respuestas, haciendo tu sitio más rápido. Un HTML de 100KB puede comprimirse a ~20KB.
> - **`expires 30d;`** → Archivos estáticos (imágenes, CSS, JS) se cachean 30 días en el navegador.
> - **Cabeceras de seguridad** → Protegen contra ataques comunes (XSS, clickjacking, MIME-sniffing).

### 6.3 Cómo Funciona Traefik con Docker

Traefik se conecta al socket de Docker (`/var/run/docker.sock`) para "ver" los contenedores en ejecución y leer sus **labels** (etiquetas). Cuando inicias un contenedor con labels específicos, Traefik automáticamente:

1. **Detecta** el nuevo contenedor
2. **Lee** las labels de configuración
3. **Crea** las rutas (routers) automáticamente
4. **Genera** certificados SSL con Let's Encrypt

**Flujo de una petición HTTPS:**
```
Internet → https://miapp.com
  → VPS Puerto 443 → Traefik (termina SSL)
    → Enruta según la label "Host(`miapp.com`)"
      → Contenedor NGINX (puerto 80, red interna)
        → Sirve tu aplicación 🎉
```

### 6.4 Labels de Traefik — Guía de Referencia

| Label | Qué hace | Ejemplo |
|---|---|---|
| `traefik.enable=true` | Activa Traefik para este contenedor | Requerido en cada servicio |
| `traefik.http.routers.X.rule` | Define qué dominio llega a este contenedor | `` Host(`miapp.com`) `` |
| `traefik.http.routers.X.entrypoints` | Por qué puerto entra (web=80, websecure=443) | `websecure` |
| `traefik.http.routers.X.tls=true` | Activa HTTPS | Siempre `true` en producción |
| `traefik.http.routers.X.tls.certresolver` | Qué resolver de certificados usar | `letsencrypt` |
| `traefik.http.services.X.loadbalancer.server.port` | Puerto interno del contenedor | `80` para NGINX, `3000` para Node |

> 💡 **Tip:** La `X` en `traefik.http.routers.X` es un nombre arbitrario que tú eliges para identificar cada router. Usa nombres descriptivos como `mi-app`, `api`, `dashboard`.

### 6.5 Configuración para Múltiples Aplicaciones

Una de las ventajas de Traefik es que puedes tener múltiples aplicaciones en el mismo VPS, cada una con su dominio:

```yaml
# Ejemplo: Dos aplicaciones en el mismo VPS

services:
  # App 1: Página principal
  landing:
    image: ghcr.io/usuario/landing:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.landing.rule=Host(`miapp.com`)"
      - "traefik.http.routers.landing.entrypoints=websecure"
      - "traefik.http.routers.landing.tls.certresolver=letsencrypt"

  # App 2: API (subdominio)
  api:
    image: ghcr.io/usuario/api:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.miapp.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"

  # App 3: Panel de administración
  admin:
    image: ghcr.io/usuario/admin:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.admin.rule=Host(`admin.miapp.com`)"
      - "traefik.http.routers.admin.entrypoints=websecure"
      - "traefik.http.routers.admin.tls.certresolver=letsencrypt"
```

> 🔥 **Poderoso:** ¡Un solo servidor VPS puede alojar decenas de aplicaciones! Cada una con su dominio, HTTPS automático, y despliegue independiente.

### 📺 Videos Recomendados para el Paso 6

| Video | Contenido |
|---|---|
| [Traefik + Docker Tutorial (TechnoTim)](https://youtu.be/n1vOfdz5Nm8) | Configuración completa con Cloudflare DNS (inglés) |
| [One Traefik, Multiple Projects](https://youtu.be/GBFbxtBZ51w) | Múltiples proyectos con un solo Traefik (inglés) |
| [Traefik + SSL + Docker Guía Visual](https://www.youtube.com/results?search_query=traefik+docker+ssl+letsencrypt+configuracion) | Guías visuales de Traefik |

---

## ✅ Prueba Final

> **Objetivo:** Verificar que TODO el pipeline funciona: push → build → deploy → HTTPS.

### Checklist de Verificación

Sigue esta lista paso a paso:

### 1. Prepara el VPS (solo la primera vez)

```bash
# Conectarse al VPS
ssh root@TU_IP_DEL_VPS

# Crear directorio del proyecto
mkdir -p /home/apps/mi-app
cd /home/apps/mi-app

# Crear archivo .env
cat > .env << 'EOF'
DOMAIN=miapp.com
LETSENCRYPT_EMAIL=tu-email@example.com
TRAEFIK_AUTH_USERS=admin:$$apr1$$xT6aHO5r$$9Qhrm.YbFjKEudvgU5aRg0
EOF

# Crear archivos necesarios
touch acme.json
chmod 600 acme.json

# Crear red de Traefik
docker network create traefik-public 2>/dev/null || true

# Copiar docker-compose.yml al VPS (por primera vez)
# Puedes usar scp desde tu máquina local:
# scp docker-compose.yml root@TU_IP:/home/apps/mi-app/
```

### 2. Hacer Push del Código

```bash
# En tu máquina local
cd mi-app
git add .
git commit -m "feat: configuración completa de despliegue automático"
git push
```

### 3. Verificar GitHub Actions

1. Ve a tu repositorio en GitHub → pestaña **Actions**
2. Deberías ver el workflow `🚀 Deploy to VPS` ejecutándose
3. Haz clic en él para ver los logs en tiempo real

### 4. Verificar el Despliegue

```bash
# Conectarse al VPS y comprobar
ssh root@TU_IP_DEL_VPS
cd /home/apps/mi-app

# Ver los contenedores corriendo
docker compose ps

# Deberías ver algo como:
# NAME           STATUS                        PORTS
# traefik        Up (healthy)   80,443/tcp
# mi-app-nginx   Up (healthy)

# Ver logs de la aplicación
docker compose logs -f nginx

# Ver logs de Traefik
docker compose logs -f traefik
```

### 5. Probar la Aplicación

```bash
# Probar que NGINX responde localmente
curl -I http://localhost:80

# Probar que Traefik está enrutando (HTTP → debe redirigir a HTTPS)
curl -I http://TU_IP_DEL_VPS

# Probar HTTPS (si tienes dominio configurado)
curl -I https://miapp.com
```

> Si tienes un dominio, abre `https://miapp.com` en tu navegador. Deberías ver tu página con el candado verde de HTTPS. 🔒

### 6. Probar el Ciclo Completo

Haz un cambio pequeño para comprobar que las actualizaciones funcionan:

```bash
# En tu máquina local
# Edita src/index.html — cambia algo visible

git add src/index.html
git commit -m "test: verificar despliegue automático"
git push

# Espera ~2 minutos y recarga tu página en el navegador
# ¡Deberías ver el cambio reflejado automáticamente!
```

### 🎉 ¡Felicidades!

Si todo funciona, has logrado:

- ✅ **Integración Continua (CI):** Cada push construye y prueba tu imagen Docker
- ✅ **Despliegue Continuo (CD):** Cada push despliega automáticamente en tu VPS
- ✅ **HTTPS Automático:** Let's Encrypt renueva tus certificados solo
- ✅ **Alta Disponibilidad:** Los contenedores se reinician solos si fallan
- ✅ **Cero Downtime:** Docker Compose reemplaza contenedores sin interrupción

### 📺 Videos Recomendados para Ciclo Completo

| Video | Contenido |
|---|---|
| [Pipeline CI/CD Completo (FreeCodeCamp)](https://www.youtube.com/results?search_query=freecodecamp+docker+cicd+github+actions+production) | Curso completo de CI/CD en producción |
| [DevOps de 0 a 100](https://www.youtube.com/results?search_query=devops+principiante+a+experto+guia+completa+2024) | Roadmap completo de DevOps |

---

## 🛟 Solución de Problemas Comunes

### El workflow falla en GitHub Actions

**Síntoma:** El workflow aparece en rojo en la pestaña Actions.

```bash
# Solución: Revisa los logs haciendo clic en el workflow fallido.
# Errores comunes:

# 1. "Permission denied (publickey)" → SSH_PRIVATE_KEY mal copiada
#    Revisa que copiaste TODO el contenido de la llave privada

# 2. "Cannot connect to docker daemon" → Docker no está corriendo en el VPS
ssh deploy@TU_IP "sudo systemctl status docker"

# 3. "denied: requested access to the resource is denied"
#    → Revisa los permisos del GITHUB_TOKEN en Settings > Actions > General
#    Workflow permissions debe ser "Read and write permissions"
```

### La aplicación no carga en el navegador

```bash
# En el VPS, verifica que los contenedores estén corriendo:
cd /home/apps/mi-app
docker compose ps

# Si algún contenedor no está "Up", revisa sus logs:
docker compose logs traefik
docker compose logs nginx

# Verificar que los puertos estén escuchando:
ss -tlnp | grep -E '80|443'

# Verificar el firewall:
sudo ufw status verbose
```

### HTTPS no funciona / Certificado SSL no se genera

```bash
# Let's Encrypt necesita que:
# 1. Tu dominio APUNTE a la IP del VPS (revisa los registros DNS)
# 2. El puerto 80 esté abierto (Let's Encrypt verifica por HTTP primero)
# 3. El email en LETSENCRYPT_EMAIL sea válido

# Verificar DNS:
nslookup miapp.com
ping miapp.com

# Ver logs de Let's Encrypt en Traefik:
docker compose logs traefik | grep -i acme
docker compose logs traefik | grep -i "letsencrypt"
docker compose logs traefik | grep -i "certificate"

# Error común: "too many certificates already issued"
# → Espera 1 hora (rate limit de Let's Encrypt en staging)
# → Para pruebas, usa el servidor staging de Let's Encrypt:
#   Añade: --certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory
```

### El contenedor de la app se reinicia constantemente

```bash
# Revisar logs del contenedor
docker compose logs nginx

# Revisar si la imagen existe:
docker images | grep mi-app

# Forzar pull de la imagen:
docker compose pull nginx
docker compose up -d nginx

# Revisar uso de recursos:
docker stats
```

### Cambios no se reflejan después del push

```bash
# 1. Verificar que el workflow se ejecutó (GitHub > Actions)
# 2. Verificar que hizo pull de la nueva imagen:
ssh deploy@TU_IP "cd /home/apps/mi-app && docker compose pull"

# 3. Verificar la etiqueta de la imagen en uso:
docker inspect mi-app-nginx | grep Image

# 4. Comparar con el SHA del último commit en GitHub:
git log -1 --format="%H"

# 5. Si no coinciden, reiniciar manualmente:
ssh deploy@TU_IP "cd /home/apps/mi-app && docker compose up -d --force-recreate"
```

### Comandos de Diagnóstico Rápido

```bash
# ─── Estado general ───
docker compose ps                        # ¿Qué contenedores están corriendo?
docker compose logs --tail=50            # Últimas 50 líneas de todos los logs

# ─── Red ───
docker network ls                        # ¿Existe la red traefik-public?
docker network inspect traefik-public    # ¿Qué contenedores están en la red?

# ─── Imágenes ───
docker images                            # Imágenes descargadas
docker system df                         # Espacio en disco usado por Docker

# ─── Limpieza ───
docker system prune -a --volumes         # ⚠️ Borra TODO lo no usado (¡cuidado!)
docker image prune -f                    # Solo imágenes sin usar
docker container prune -f                # Solo contenedores parados
```

### 📺 Videos de Troubleshooting

| Video | Contenido |
|---|---|
| [Debugging Docker Containers](https://www.youtube.com/results?search_query=docker+troubleshooting+debug+containers+crash) | Cómo diagnosticar problemas en Docker |
| [Traefik Debugging Guide](https://www.youtube.com/results?search_query=traefik+debug+troubleshooting+ssl+certificate) | Solución de problemas comunes de Traefik |

---

## 📚 Recursos Adicionales

### Canales de YouTube Recomendados (Español)

| Canal | Especialidad |
|---|---|
| **Pelado Nerd** | Docker, Kubernetes, DevOps, Cloud |
| **midulive** | Desarrollo web, Node.js, JavaScript |
| **Gentleman Programming** | Backend, Docker, microservicios |
| **Carlos Azaustre** | JavaScript, Node.js, Docker, Cloud |

### Documentación Oficial

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Traefik Docs](https://doc.traefik.io/traefik/)
- [GitHub Actions Docs](https://docs.github.com/es/actions)
- [NGINX Docs](https://nginx.org/en/docs/)

---

> 💡 **¿Encontraste un error o tienes una sugerencia?** ¡Abre un issue en el repositorio! Esta guía es un documento vivo.
>
> **Última actualización:** Julio 2026
