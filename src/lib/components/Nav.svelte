<script lang="ts">
	import { page } from '$app/stores';
	import { signOut } from '@auth/sveltekit/client';

	let { session } = $props<{ session: any }>();
	let mobileMenuOpen = $state(false);

	function isActive(path: string): boolean {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}

	async function handleSignOut() {
		await signOut({ callbackUrl: '/' });
	}
</script>

<nav class="sticky top-0 z-50 animate-fade-in-down border-b border-white/30 bg-white/60 backdrop-blur-xl">
	<div class="w-full px-6 sm:px-8 lg:px-12">
		<div class="flex justify-between h-16">
			<div class="flex items-center">
				<a href="/" class="flex items-center gap-2 group">
					<div class="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-indigo-500/25 transition-shadow duration-300">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<span class="text-xl font-bold gradient-text">AuthApp</span>
				</a>
				<div class="hidden sm:ml-8 sm:flex sm:space-x-1">
					{#if session?.user}
						<a
							href="/dashboard"
							class="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive('/dashboard') && !isActive('/dashboard/profile') && !isActive('/dashboard/chat')
								? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
								: 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'}"
						>
							<span class="flex items-center gap-1.5">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
								Dashboard
							</span>
						</a>
						<a
							href="/dashboard/profile"
							class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive('/dashboard/profile')
								? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
								: 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'}"
						>
							<span class="flex items-center gap-1.5">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
								Profile
							</span>
						</a>
						<a
							href="/dashboard/chat"
							class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive('/dashboard/chat')
								? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
								: 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'}"
						>
							<span class="flex items-center gap-1.5">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
								AI Chat
							</span>
						</a>
						<a
							href="/dashboard/documents"
							class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive('/dashboard/documents')
								? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
								: 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/50'}"
						>
							<span class="flex items-center gap-1.5">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
								Documents
							</span>
						</a>
						{#if session.user.role === 'admin'}
							<a
								href="/admin"
								class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 {isActive('/admin')
									? 'bg-purple-50 text-purple-700 shadow-sm shadow-purple-100'
									: 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'}"
							>
								<span class="flex items-center gap-1.5">
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
									Admin
								</span>
							</a>
						{/if}
					{/if}
				</div>
			</div>

			<div class="hidden sm:flex sm:items-center sm:space-x-3">
				{#if session?.user}
					<div class="flex items-center gap-3">
						<div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
							<div class="h-6 w-6 rounded-full bg-gradient-to-br {session.user.role === 'admin' ? 'from-purple-400 to-purple-600' : 'from-indigo-400 to-indigo-600'} flex items-center justify-center">
								<span class="text-[10px] font-bold text-white">
									{(session.user.name || session.user.email)?.[0]?.toUpperCase() ?? '?'}
								</span>
							</div>
							<span class="text-sm font-medium text-gray-700">
								{session.user.name || session.user.email}
							</span>
							<span
								class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide {session.user.role === 'admin'
									? 'bg-purple-100 text-purple-700'
									: 'bg-emerald-100 text-emerald-700'}"
							>
								{session.user.role}
							</span>
						</div>
						<button
							onclick={handleSignOut}
							class="group px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all duration-300 cursor-pointer"
						>
							<span class="flex items-center gap-1.5">
								<svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
								Sign Out
							</span>
						</button>
					</div>
				{:else}
					<a
						href="/auth/login"
						class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-300"
					>
						Login
					</a>
					<a
						href="/auth/register"
						class="btn-shine px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
					>
						Get Started
					</a>
				{/if}
			</div>

			<!-- Mobile menu button -->
			<div class="flex items-center sm:hidden">
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300 cursor-pointer"
				>
					<svg class="h-6 w-6 transition-transform duration-300 {mobileMenuOpen ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						{#if mobileMenuOpen}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						{/if}
					</svg>
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="sm:hidden border-t border-gray-100 animate-slide-down">
			<div class="px-3 pt-3 pb-4 space-y-1">
				{#if session?.user}
					<div class="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-gray-50">
						<div class="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
							<span class="text-xs font-bold text-white">{(session.user.name || session.user.email)?.[0]?.toUpperCase() ?? '?'}</span>
						</div>
						<div>
							<div class="text-sm font-medium text-gray-900">{session.user.name || 'User'}</div>
							<div class="text-xs text-gray-500">{session.user.email}</div>
						</div>
					</div>
					<a href="/dashboard" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
						Dashboard
					</a>
					<a href="/dashboard/profile" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
						Profile
					</a>
					<a href="/dashboard/chat" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
						AI Chat
					</a>
					<a href="/dashboard/documents" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
						Documents
					</a>
					{#if session.user.role === 'admin'}
						<a href="/admin" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
							Admin
						</a>
					{/if}
					<hr class="my-2 border-gray-100" />
					<button
						onclick={handleSignOut}
						class="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
						Sign Out
					</button>
				{:else}
					<a href="/auth/login" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Login</a>
					<a href="/auth/register" class="block px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">Register</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>
