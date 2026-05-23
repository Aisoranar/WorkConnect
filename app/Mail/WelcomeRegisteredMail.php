<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeRegisteredMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bienvenido a WorkConnect',
        );
    }

    public function content(): Content
    {
        $dashboardUrl = rtrim((string) config('workconnect.frontend_url'), '/').'/dashboard';

        return new Content(
            markdown: 'mail.welcome',
            with: [
                'user' => $this->user,
                'dashboardUrl' => $dashboardUrl,
                'roleLabel' => $this->roleLabel(),
            ],
        );
    }

    private function roleLabel(): string
    {
        return match ($this->user->role) {
            'client' => 'empresa',
            'admin' => 'administrador',
            default => 'talento joven',
        };
    }
}
