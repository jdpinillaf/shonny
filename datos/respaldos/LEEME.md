# Respaldos

Volcados con fecha de lo que no vive en git y se perdería si se rompe un enlace con
un servicio externo.

- `redis-<fecha>.json` — la lista `piezas` de Upstash Redis: las confesiones
  moderadas del museo de Colapsar, con las URLs de las fotos que hay en Vercel Blob.
  Están atadas al proyecto de Vercel `prj_7Ejsk…` por env vars; si ese proyecto se
  borra o los tokens rotan, esto es lo único que queda.

El volcado se hace a mano desde `sitios/colapsar`, con las env vars de producción
(`vercel env pull`) y una llamada de solo lectura a la API REST de Upstash. No es
parte de ningún guion automático a propósito: correrlo es una decisión, no un hábito.
