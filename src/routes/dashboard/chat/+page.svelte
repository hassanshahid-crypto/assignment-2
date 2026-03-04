<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import { DefaultChatTransport } from 'ai';

	let inputValue = $state('');

	const chat = new Chat({
		transport: new DefaultChatTransport({
			api: '/api/chat'
		})
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const text = inputValue.trim();
		if (!text) return;
		inputValue = '';
		await chat.sendMessage({ text });
	}

	function getMessageText(parts: Array<{ type: string; text?: string }>): string {
		return parts
			.filter((p) => p.type === 'text')
			.map((p) => p.text ?? '')
			.join('');
	}
</script>

<svelte:head>
	<title>AI Chat - AuthApp</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] flex flex-col max-w-4xl mx-auto px-4 py-6">
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold gradient-text">AI Chat</h1>
		<p class="text-sm text-gray-500 mt-1">Powered by Google Gemini</p>
	</div>

	<!-- Chat Messages -->
	<div class="flex-1 overflow-y-auto space-y-4 mb-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg shadow-indigo-200/20 p-6">
		{#if chat.messages.length === 0}
			<div class="flex flex-col items-center justify-center h-64 text-gray-400">
				<svg class="h-12 w-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
				</svg>
				<p class="text-sm font-medium">Start a conversation</p>
				<p class="text-xs mt-1">Type a message below to chat with AI</p>
			</div>
		{/if}

		{#each chat.messages as message}
			<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div class="max-w-[80%] {message.role === 'user'
					? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md'
					: 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md'} px-4 py-3 shadow-sm">
					<div class="text-xs font-semibold mb-1 {message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'}">
						{message.role === 'user' ? 'You' : 'AI Assistant'}
					</div>
					<div class="text-sm whitespace-pre-wrap leading-relaxed">{getMessageText(message.parts)}</div>
				</div>
			</div>
		{/each}

		{#if chat.status === 'submitted'}
			<div class="flex justify-start">
				<div class="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
					<div class="text-xs font-semibold mb-1 text-gray-500">AI Assistant</div>
					<div class="flex items-center gap-1">
						<div class="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
						<div class="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
						<div class="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
					</div>
				</div>
			</div>
		{/if}

		{#if chat.status === 'error' && chat.error}
			<div class="rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
				<svg class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
				<p class="text-sm text-red-700">Something went wrong. Please try again.</p>
			</div>
		{/if}
	</div>

	<!-- Input Form -->
	<form onsubmit={handleSubmit} class="flex gap-3">
		<input
			bind:value={inputValue}
			placeholder="Type your message..."
			disabled={chat.status === 'submitted' || chat.status === 'streaming'}
			class="flex-1 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none transition-all duration-300 disabled:opacity-50"
		/>
		<button
			type="submit"
			disabled={chat.status === 'submitted' || chat.status === 'streaming' || !inputValue.trim()}
			class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300"
		>
			{#if chat.status === 'submitted' || chat.status === 'streaming'}
				<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
				</svg>
			{:else}
				Send
			{/if}
		</button>
	</form>
</div>
