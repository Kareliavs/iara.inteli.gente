# IARAInteli.gente — versión estática (GitHub Pages)

Este proyecto originalmente necesita un backend Node/Express + una base de
datos Postgres. GitHub Pages solo sirve archivos estáticos: no puede correr
ni el backend ni la base de datos. Esta rama del proyecto fue adaptada para
funcionar **sin backend**, exportando de antemano todos los datos que las
páginas públicas necesitan.

## Qué funciona en la versión estática

Todo lo que es **solo lectura**, es decir, el corazón público del sitio:

- Buscador y mapa de municípios (`/municipios`)
- Página de detalle de cada município (indicadores, comparativos
  regionales, resumo por dimensão, series históricas de GINI/PIB)
- Metodologia e Indicadores

Los datos de los **5.571 municípios de Brasil** están precomputados como
JSON en `frontend/public/data/` (generados a partir de tu backup de
Postgres — ver `scripts/static-export/README.md`).

## Qué NO funciona (porque requiere un servidor real)

- Login/área da prefeitura, cadastro, redefinição de senha
- Formulário de autodeclaração
- Painel de administração
- Assistente de IA (`/api/assistente/consultar`)

Estas pantallas muestran un mensaje claro ("não disponível nesta versão
estática") en vez de quedarse cargando para siempre — no rompen, solo
avisan que necesitan backend.

## Cómo se hizo (resumen técnico)

1. Se restauró tu backup de Postgres (formato de dump 1.16) en una
   instancia local, ya que las herramientas estándar no soportaban ese
   formato — se usó la librería `pgdumplib` para leerlo directamente.
2. Se levantó el backend real contra esa base y se optimizó una query
   costosa (`municípios semelhantes`, `resumo por dimensão`) que
   recalculaba todo el país en cada llamada — ahora usa caché en memoria
   (mismo resultado, mucho más rápido).
3. Se generó, golpeando el backend real, un bundle JSON por município con
   todo lo que sus páginas necesitan.
4. Se creó `frontend/src/lib/staticApi.js`: intercepta las llamadas
   `fetch("/api/...")` que el código YA hacía, y las responde con esos
   JSON en vez de pegarle a un servidor. El resto del código de la app
   **no se tocó** — no hubo que reescribir componentes.
5. Se cambió el router de `BrowserRouter` a `HashRouter` (para que abrir
   una URL como `/municipios/algum-municipio-sp` directamente, o recargar
   la página, funcione sin configurar el servidor — típico requisito de
   hosting 100% estático).
6. `vite.config.js` usa `base: "./"` (rutas relativas) para que el build
   funcione en cualquier subcarpeta (por ejemplo
   `usuario.github.io/nombre-del-repo/`).
7. Se agregó `.github/workflows/deploy-pages.yml`: cada `git push` a
   `main` compila el frontend y lo publica en GitHub Pages
   automáticamente — no hace falta correr `npm run build` a mano.

## Cómo publicarlo

1. Crea un repositorio en GitHub y sube esta carpeta (`git init`,
   `git add .`, `git commit`, `git push`).
2. En el repo: **Settings → Pages → Source → GitHub Actions**.
3. Listo — cada push a `main` lo compila y publica solo.

Si preferís no usar Actions, también podés compilar localmente
(`cd frontend && npm install && npm run build`) y subir el contenido de
`frontend/dist/` directamente a la rama que sirva Pages.

## Tamaño del dataset

`frontend/public/data/` pesa ~220 MB (JSON de los 5.571 municípios). Es
mucho para un repo git normal, pero ningún archivo individual supera los
límites de GitHub (100 MB), así que el push funciona — solo puede tardar
un poco más de lo habitual. Si en algún momento se vuelve un problema, se
puede migrar esa carpeta a Git LFS.

## Si más adelante tenés un backend real

El backend (`backend/`) y la base de datos (`database/`) siguen intactos
y funcionando — nada de esto los rompe. `frontend/src/lib/staticApi.js`
solo se activa porque `main.jsx` lo importa; si algún día servís el
frontend con el backend real detrás, basta con no llamar a
`installStaticApi()` (o condicionarlo a una variable de entorno) para
que la app vuelva a hablarle a `/api/...` de verdad.
