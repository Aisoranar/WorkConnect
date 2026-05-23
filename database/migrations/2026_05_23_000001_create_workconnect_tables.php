<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_listings', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('company');
            $table->string('budget');
            $table->string('location');
            $table->boolean('remote')->default(false);
            $table->string('category');
            $table->text('description');
            $table->json('skills');
            $table->unsignedTinyInteger('match');
            $table->string('posted_ago');
            $table->unsignedInteger('applicants')->default(0);
            $table->timestamps();
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('job_title');
            $table->string('company');
            $table->string('price');
            $table->string('status');
            $table->string('sent_ago');
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('avatar');
            $table->text('preview');
            $table->string('time');
            $table->unsignedTinyInteger('unread')->default(0);
            $table->timestamps();
        });

        Schema::create('dashboard_stats', function (Blueprint $table) {
            $table->id();
            $table->decimal('rating', 3, 1);
            $table->unsignedInteger('projects_done');
            $table->string('earnings');
            $table->unsignedTinyInteger('response_rate');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_stats');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('job_listings');
    }
};
