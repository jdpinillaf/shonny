# Desplegar

## Los dos proyectos de Vercel

| Proyecto | Root Directory | Dominio |
|---|---|---|
| `shonny-oficial` | `sitios/oficial` | shonny-oficial.vercel.app · después shonny.co |
| `colapsar` | `sitios/colapsar` | colapsar.shonny.co |

Los dos tienen **"Include source files outside of the Root Directory" en ON**: sin
eso no hay `npm install` en la raíz y los paquetes compartidos no existen para el
build.

## Cómo se despliega hoy

Desde la **raíz del repo**, no desde la carpeta del sitio: el CLI sube lo que hay
en el directorio actual, y desde `sitios/oficial` los paquetes de `paquetes/` no
viajarían.

```bash
vercel deploy --prod
```

El `.vercel/project.json` de la raíz decide a qué proyecto va. Para cambiar de
sitio:

```bash
vercel link --project shonny-oficial --yes   # o: --project colapsar
```

**Esto es temporal y es incómodo a propósito de nadie.** En cuanto la app de
Vercel en GitHub tenga acceso al repo `jdpinillaf/shonny`, cada proyecto compila
su carpeta en cada push y no hay que acordarse de re-enlazar nada. Es el único
paso que falta y lo tiene que autorizar el dueño de la cuenta en el navegador.

## Variables de entorno

Viven en el panel de cada proyecto de Vercel, nunca en el repo. Localmente van en
`sitios/oficial/.env.local`, que está en `.gitignore`.

```bash
vercel env ls                    # qué hay
vercel env pull .env.local       # traerlas al portátil
```

Las que usa el sitio están documentadas en `sitios/oficial/.env.ejemplo`.

## Verificar después de desplegar

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://shonny-oficial.vercel.app
```

La URL con el hash del deploy (`shonny-oficial-msd2gtaev-…`) devuelve **302**: las
URLs de deploy están protegidas por autenticación. La que se comparte es la del
proyecto, sin hash, que da 200.
