<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('dashboard_stats');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('job_listings');

        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
            $table->string('role')->default('freelancer')->after('password');
            $table->string('city')->nullable()->after('role');
            $table->string('avatar')->nullable()->after('city');
            $table->text('bio')->nullable()->after('avatar');
            $table->decimal('rating', 3, 1)->default(0)->after('bio');
            $table->boolean('verified')->default(false)->after('rating');
            $table->string('github')->nullable()->after('verified');
            $table->string('linkedin')->nullable()->after('github');
            $table->text('experience')->nullable()->after('linkedin');
        });

        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('category')->nullable();
            $table->timestamps();
        });

        Schema::create('user_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->string('level')->default('intermedio');
            $table->timestamps();
            $table->unique(['user_id', 'skill_id']);
        });

        Schema::create('portfolio_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('url')->nullable();
            $table->json('technologies')->nullable();
            $table->timestamps();
        });

        Schema::create('work_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('budget');
            $table->string('location')->nullable();
            $table->boolean('remote')->default(true);
            $table->string('status')->default('open');
            $table->string('category')->nullable();
            $table->date('deadline')->nullable();
            $table->string('company')->nullable();
            $table->json('skills')->nullable();
            $table->timestamps();
        });

        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('work_jobs')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('proposal');
            $table->string('price');
            $table->string('delivery_time');
            $table->string('status')->default('pendiente');
            $table->timestamps();
            $table->unique(['job_id', 'user_id']);
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('work_jobs')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->text('message');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->boolean('read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('work_jobs');
        Schema::dropIfExists('portfolio_projects');
        Schema::dropIfExists('user_skill');
        Schema::dropIfExists('skills');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username', 'role', 'city', 'avatar', 'bio',
                'rating', 'verified', 'github', 'linkedin', 'experience',
            ]);
        });
    }
};
