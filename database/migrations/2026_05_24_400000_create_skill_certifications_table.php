<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skill_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('skill_name', 120);
            $table->unsignedTinyInteger('score');
            $table->boolean('passed');
            $table->unsignedTinyInteger('correct_count');
            $table->unsignedTinyInteger('total');
            $table->string('certificate_id', 32)->nullable();
            $table->timestamp('attempted_at')->useCurrent();
            $table->timestamps();

            $table->index(['user_id', 'attempted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skill_certifications');
    }
};
