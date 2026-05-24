<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Smalot\PdfParser\Parser as PdfParser;

class CareerDocumentExtractor
{
    public function __construct(
        private readonly AIService $ai,
    ) {}

    /**
     * @param  array<int, UploadedFile>  $files
     * @return array{combined: string, file_summaries: array<int, array{name: string, type: string, excerpt: string}>}
     */
    public function extractFromFiles(array $files): array
    {
        $chunks = [];
        $summaries = [];

        foreach ($files as $file) {
            if (! $file instanceof UploadedFile || ! $file->isValid()) {
                continue;
            }

            $name = $file->getClientOriginalName();
            $mime = (string) $file->getMimeType();
            $ext = strtolower($file->getClientOriginalExtension());

            $text = $this->extractText($file, $ext);

            if ($this->isImage($ext, $mime)) {
                $description = $this->ai->describeCareerDocumentImage(
                    base64_encode((string) file_get_contents($file->getRealPath())),
                    $mime ?: 'image/jpeg',
                    $name,
                );
                $text = $description ?: 'Imagen adjunta. El candidato debe describir el contenido en el campo de texto si la IA no pudo leerla.';
            }

            $text = trim($text);
            $summaries[] = [
                'name' => $name,
                'type' => $ext ?: 'archivo',
                'excerpt' => mb_substr($text, 0, 500),
            ];

            if ($text !== '') {
                $chunks[] = "── Archivo: {$name} ──\n{$text}";
            }
        }

        return [
            'combined' => trim(implode("\n\n", $chunks)),
            'file_summaries' => $summaries,
        ];
    }

    private function extractText(UploadedFile $file, string $ext): string
    {
        $path = $file->getRealPath();

        if (in_array($ext, ['txt', 'md'], true)) {
            return trim((string) file_get_contents($path));
        }

        if ($ext === 'pdf') {
            try {
                $parser = new PdfParser();
                $pdf = $parser->parseFile($path);
                $text = trim($pdf->getText());

                if (mb_strlen($text) > 30) {
                    return mb_substr($text, 0, 15000);
                }
            } catch (\Throwable) {
                // fallback silencioso
            }

            return 'PDF adjunto. Incluye también un resumen en texto si el extracto automático es incompleto.';
        }

        if ($ext === 'docx') {
            return $this->extractDocx($path);
        }

        return '';
    }

    private function extractDocx(string $path): string
    {
        if (! class_exists(\ZipArchive::class)) {
            return 'Documento Word adjunto. Copia el texto relevante en el campo de notas.';
        }

        $zip = new \ZipArchive;
        if ($zip->open($path) !== true) {
            return 'No se pudo leer el DOCX. Pega el contenido en texto.';
        }

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if (! is_string($xml) || $xml === '') {
            return '';
        }

        $text = strip_tags(str_replace(['</w:p>', '<w:tab/>'], ["\n", ' '], $xml));
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
    }

    private function isImage(string $ext, string $mime): bool
    {
        return in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'gif'], true)
            || str_starts_with($mime, 'image/');
    }
}
