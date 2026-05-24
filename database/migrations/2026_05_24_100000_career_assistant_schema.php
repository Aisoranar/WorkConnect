<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('target_role')->nullable()->after('experience');
            $table->text('cv_text')->nullable()->after('target_role');
            $table->text('linkedin_headline')->nullable()->after('cv_text');
        });

        Schema::create('external_job_listings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('company');
            $table->string('location')->nullable();
            $table->string('apply_url');
            $table->string('source')->default('aggregated');
            $table->json('skills')->nullable();
            $table->text('summary')->nullable();
            $table->string('week_key', 10)->index();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('career_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 64);
            $table->json('input')->nullable();
            $table->json('output');
            $table->string('source', 16)->default('local');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('career_sessions');
        Schema::dropIfExists('external_job_listings');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['target_role', 'cv_text', 'linkedin_headline']);
        });
    }
};
