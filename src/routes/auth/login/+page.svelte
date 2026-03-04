<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { signIn } from '@auth/sveltekit/client';

	let { form } = $props();
	let loading = $state(false);
	let resetSuccess = $derived($page.url.searchParams.get('reset') === 'success');
	let verifySuccess = $derived($page.url.searchParams.get('verified') === 'true');
	let needsVerification = $derived($page.url.searchParams.get('verify') === 'required');
	let oauthError = $derived($page.url.searchParams.get('error'));
</script>

<svelte:head>
	<title>Sign In - AuthApp</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
	<!-- Decorative blobs -->
	<div class="absolute top-1/4 left-10 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
	<div class="absolute bottom-1/4 right-10 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style="animation-delay: 1.5s;"></div>

	<div class="relative w-full max-w-md animate-fade-in-up">
		<!-- Card -->
		<div class="bg-white/70 backdrop-blur-2xl rounded-2xl shadow-xl shadow-indigo-200/30 border border-white/50 ring-1 ring-white/30 p-8 sm:p-10">
			<div class="text-center mb-8">
				<div class="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-5">
					<svg class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
					</svg>
				</div>
				<h2 class="text-2xl font-bold text-gray-900">Welcome back</h2>
				<p class="mt-2 text-sm text-gray-500">
					Don't have an account?
					<a href="/auth/register" class="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">Sign up</a>
				</p>
			</div>

			{#if resetSuccess}
				<div class="alert-enter mb-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
					<svg class="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
					<p class="text-sm text-emerald-700">Password reset successful! Sign in with your new password.</p>
				</div>
			{/if}

			{#if verifySuccess}
				<div class="alert-enter mb-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
					<svg class="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
					<p class="text-sm text-emerald-700">Email verified successfully! You can now sign in.</p>
				</div>
			{/if}

			{#if needsVerification}
				<div class="alert-enter mb-6 rounded-xl bg-amber-50 border border-amber-100 p-4 flex items-start gap-3">
					<svg class="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
					<p class="text-sm text-amber-700">We've sent a verification link to your email. Please check your inbox and click the link to verify your account.</p>
				</div>
			{/if}

			{#if oauthError}
				<div class="alert-enter mb-6 rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
					<svg class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
					<p class="text-sm text-red-700">
						{#if oauthError === 'OAuthCallbackError'}
							OAuth sign-in failed. Please check your provider configuration.
						{:else if oauthError === 'OAuthAccountNotLinked'}
							This email is already registered with a different sign-in method.
						{:else}
							Sign-in error: {oauthError}
						{/if}
					</p>
				</div>
			{/if}

			{#if form?.error}
				<div class="alert-enter mb-6 rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
					<svg class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
					<p class="text-sm text-red-700">{form.error}</p>
				</div>
			{/if}

			<form
				method="POST"
				autocomplete="off"
				class="space-y-5"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<!-- Hidden dummy fields to absorb browser autofill -->
				<input type="text" name="fake_user" autocomplete="username" style="position:absolute;opacity:0;height:0;width:0;pointer-events:none;" tabindex="-1" />
				<input type="password" name="fake_pass" autocomplete="current-password" style="position:absolute;opacity:0;height:0;width:0;pointer-events:none;" tabindex="-1" />

				<div>
					<label for="login-email" class="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
					<input
						id="login-email"
						name="email"
						type="email"
						autocomplete="one-time-code"
						required
						value={form?.email ?? ''}
						class="input-glow block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-400 focus:outline-none text-sm transition-all duration-300"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<div class="flex items-center justify-between mb-1.5">
						<label for="login-password" class="block text-sm font-medium text-gray-700">Password</label>
						<a href="/auth/forgot-password" class="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Forgot password?</a>
					</div>
					<input
						id="login-password"
						name="password"
						type="password"
						autocomplete="one-time-code"
						required
						class="input-glow block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-400 focus:outline-none text-sm transition-all duration-300"
						placeholder="Enter your password"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="btn-shine w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300"
				>
					{#if loading}
						<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
						Signing in...
					{:else}
						Sign In
					{/if}
				</button>
			</form>

			<!-- Divider -->
			<div class="relative my-7">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-200"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-white/70 px-3 text-gray-400">or continue with</span>
				</div>
			</div>

			<!-- OAuth Buttons -->
			<div class="space-y-3">
				<!-- Google Sign-In -->
				<button
					type="button"
					onclick={() => signIn('google', { callbackUrl: '/dashboard' })}
					class="w-full flex justify-center items-center gap-3 rounded-xl border border-gray-200 bg-white/50 px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-white hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300"
				>
					<svg class="h-5 w-5" viewBox="0 0 24 24">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					Sign in with Google
				</button>

				<!-- GitHub Sign-In -->
				<button
					type="button"
					onclick={() => signIn('github', { callbackUrl: '/dashboard' })}
					class="w-full flex justify-center items-center gap-3 rounded-xl border border-gray-200 bg-white/50 px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-white hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300"
				>
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
					</svg>
					Sign in with GitHub
				</button>
			</div>
		</div>
	</div>
</div>
