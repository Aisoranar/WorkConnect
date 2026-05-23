# WorkConnect — Visión y problemática

## El problema (dos caras de la misma moneda)

### Jóvenes sin experiencia
- Necesitan **portafolio y proyectos reales** para competir en el mercado laboral.
- Muchas veces **no conocen** qué problemas resuelven las pequeñas empresas ni cómo plantear soluciones que un negocio entienda.
- Sin entregas verificables, el CV queda vacío aunque tengan habilidades técnicas.

### Empresas con poco presupuesto
- Tienen necesidades concretas (web, catálogo, automatización simple) pero **no pueden pagar** un equipo completo de desarrollo o diseño.
- Saben resolver su negocio (logística, ventas, servicio) pero **no saben escribir** un brief técnico ni dimensionar el proyecto.
- Necesitan **optimizar costos** y resultados rápidos, no procesos de agencia de seis meses.

## La propuesta de WorkConnect

Un marketplace de **micro-proyectos** donde:

1. **La empresa** describe su necesidad en lenguaje cotidiano y define un presupuesto acotado.
2. **La IA** convierte esa solicitud en un **requerimiento estructurado** (título, alcance, entregables, skills).
3. **El joven** explora proyectos, ve su compatibilidad (matching) y postula con propuesta asistida por IA.
4. Al completar entregas, el joven **acumula reputación y casos** para escalar a empleos o proyectos mayores.

## Flujo principal

```
Empresa (client)          IA                    Joven (freelancer)
     |                     |                            |
     |-- necesidad cruda -->|                            |
     |                     |-- requerimiento claro ---->|
     |                     |                            |-- postula
     |<-------------------- entrega + reputación -------|
```

## Roles en la plataforma

| Rol | Objetivo |
|-----|----------|
| `freelancer` | Ganar experiencia, ingresos modestos y score en proyectos acotados |
| `client` | Publicar necesidades, recibir postulaciones y contratar talento joven |
| `admin` | Operación y demo (hackatón / piloto) |

## Diferenciadores vs. freelance genérico

- **Brief asistido por IA**: baja la barrera para empresas que no saben redactar specs.
- **Matching por habilidades y fit**: el joven no pierde tiempo en proyectos imposibles.
- **Enfoque juvenil / primer empleo**: proyectos pequeños, presupuestos realistas, reputación como moneda de crecimiento.
- **Puente al mercado laboral**: cada proyecto es evidencia para la siguiente oportunidad (incl. empresas que ya usan la plataforma como clientes).

## MVP actual (hackatón)

- Auth Sanctum, perfiles, skills, jobs, postulaciones, mensajes.
- `POST /api/ai/structure-project` — estructura necesidad → proyecto.
- `POST /api/ai/improve-proposal` — mejora carta de postulación.
- Matching local o con Gemini/OpenAI si hay API key.
- Front: explorar, postular, publicar proyecto (clientes), dashboard por rol.

## Próximos pasos sugeridos

- Pagos / escrow y estados de proyecto (en progreso, entregado, pagado).
- Portafolio público con QR para ferias de empleo.
- Categorías por sector (retail, servicios, agro, etc.) para orientar a jóvenes sin experiencia de mercado.
- Métricas para aliados (gobierno, universidades, cámaras de comercio).
