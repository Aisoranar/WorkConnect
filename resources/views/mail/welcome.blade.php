<x-mail::message>
# ¡Bienvenido a WorkConnect, {{ $user->name }}!

Tu registro como **{{ $roleLabel }}** se completó correctamente.

WorkConnect conecta jóvenes que buscan experiencia con empresas que necesitan micro-proyectos a bajo costo.

<x-mail::button :url="$dashboardUrl">
Ir a mi panel
</x-mail::button>

@if ($user->role === 'client')
**Siguiente paso:** publica tu necesidad en lenguaje sencillo; la IA la convertirá en un requerimiento para que el talento joven pueda postular.
@else
**Siguiente paso:** explora proyectos, revisa tu compatibilidad y postula para sumar casos a tu portafolio.
@endif

Si no creaste esta cuenta, responde a este correo o contacta soporte.

Gracias,<br>
{{ config('mail.from.name') }}
</x-mail::message>
