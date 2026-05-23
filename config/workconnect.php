<?php

return [

    /*
    | URL base del frontend (React). Se usa en enlaces de correo (reset password).
    | Si FRONTEND_URL tiene varias URLs separadas por coma, se usa la primera.
    */
    'frontend_url' => trim(explode(',', (string) env('FRONTEND_URL', 'http://localhost:8080'))[0]),

];
