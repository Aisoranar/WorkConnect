<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    protected function resetUrl(object $notifiable): string
    {
        $base = rtrim((string) config('workconnect.frontend_url'), '/');

        return $base.'/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = $this->resetUrl($notifiable);
        $minutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

        return (new MailMessage)
            ->subject('Restablecer contraseña · WorkConnect')
            ->greeting('Hola, '.$notifiable->name)
            ->line('Recibimos una solicitud para restablecer la contraseña de tu cuenta en WorkConnect.')
            ->action('Crear nueva contraseña', $url)
            ->line('Este enlace expira en '.$minutes.' minutos.')
            ->line('Si no solicitaste el cambio, ignora este correo; tu contraseña no se modificará.')
            ->salutation('Equipo WorkConnect');
    }
}
