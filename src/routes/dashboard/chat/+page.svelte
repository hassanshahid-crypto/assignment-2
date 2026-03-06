<script lang="ts">
	import { onMount } from 'svelte';
	import ChatMessage from '$lib/components/ChatMessage.svelte';

	// ── State ──
	let inputValue = $state('');
	let chatMessages: any[] = $state([]);
	let isStreaming = $state(false);
	let currentConversationId = $state<string | null>(null);
	let conversationsList = $state<any[]>([]);
	let sidebarOpen = $state(true);
	let citations = $state<any[]>([]);
	let searchQuery = $state('');
	let chatContainer: HTMLElement;

	// ── Branch state ──
	// Map of parentId -> array of sibling message ids
	let branchMap = $state<Map<string, string[]>>(new Map());
	// Map of parentId -> currently selected branch index
	let activeBranch = $state<Map<string, number>>(new Map());

	// ── Computed ──
	let filteredConversations = $derived(
		searchQuery
			? conversationsList.filter((c) =>
					c.title.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: conversationsList
	);

	// Build the active message path through the tree
	let activeMessages = $derived.by(() => {
		if (!chatMessages.length) return [];

		// Build a tree: parentId -> children
		const childrenOf = new Map<string, any[]>();
		for (const msg of chatMessages) {
			const parent = msg.parentId || '__root__';
			if (!childrenOf.has(parent)) childrenOf.set(parent, []);
			childrenOf.get(parent)!.push(msg);
		}

		// Walk the active branch
		const path: any[] = [];
		let currentParent = '__root__';

		while (childrenOf.has(currentParent)) {
			const siblings = childrenOf.get(currentParent)!;
			if (!siblings.length) break;

			const branchIdx = activeBranch.get(currentParent) ?? 0;
			const selected = siblings[Math.min(branchIdx, siblings.length - 1)];
			path.push({
				...selected,
				branchInfo: siblings.length > 1 ? {
					current: Math.min(branchIdx, siblings.length - 1),
					total: siblings.length
				} : undefined
			});
			currentParent = selected.id;
		}

		return path;
	});

	onMount(() => {
		loadConversations();
	});

	// ── API helpers ──
	async function loadConversations() {
		const res = await fetch('/api/conversations');
		if (res.ok) {
			const data = await res.json();
			conversationsList = data.conversations;
		}
	}

	async function createConversation() {
		const res = await fetch('/api/conversations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: 'New Chat' })
		});
		if (res.ok) {
			const data = await res.json();
			currentConversationId = data.conversation.id;
			chatMessages = [];
			citations = [];
			activeBranch = new Map();
			await loadConversations();
		}
	}

	async function loadConversation(id: string) {
		currentConversationId = id;
		const res = await fetch(`/api/conversations/${id}`);
		if (res.ok) {
			const data = await res.json();
			chatMessages = data.messages;
			citations = [];
			activeBranch = new Map();
		}
	}

	async function deleteConversation(id: string) {
		await fetch('/api/conversations', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ conversationId: id })
		});
		if (currentConversationId === id) {
			currentConversationId = null;
			chatMessages = [];
		}
		await loadConversations();
	}

	async function saveMessage(
		role: string,
		content: string,
		parentId: string | null,
		citationsData?: any[],
		branchIndex?: number
	) {
		const res = await fetch('/api/messages', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conversationId: currentConversationId,
				parentId,
				role,
				content,
				citations: citationsData,
				branchIndex: branchIndex ?? 0
			})
		});
		if (res.ok) {
			const data = await res.json();
			return data.message;
		}
		return null;
	}

	// ── Chat logic ──
	async function handleSubmit(e: Event) {
		e.preventDefault();
		const text = inputValue.trim();
		if (!text || isStreaming) return;

		// Create conversation if none
		if (!currentConversationId) {
			const res = await fetch('/api/conversations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: text.slice(0, 50) })
			});
			if (res.ok) {
				const data = await res.json();
				currentConversationId = data.conversation.id;
				await loadConversations();
			}
		}

		inputValue = '';

		// Find the last message in the active path as parent
		const lastMsg = activeMessages.length > 0 ? activeMessages[activeMessages.length - 1] : null;

		// Save user message
		const userMsg = await saveMessage('user', text, lastMsg?.id || null);
		if (userMsg) {
			chatMessages = [...chatMessages, userMsg];
		}

		scrollToBottom();

		// Stream AI response
		isStreaming = true;
		citations = [];

		try {
			// Build messages from active path for context
			const contextMessages = [...activeMessages, userMsg].filter(Boolean).map((m: any) => ({
				role: m.role,
				content: m.content
			}));

			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: contextMessages })
			});

			// Parse citations from header
			const citationHeader = res.headers.get('X-Citations');
			if (citationHeader) {
				try {
					citations = JSON.parse(citationHeader);
				} catch {}
			}

			if (!res.ok) throw new Error('Chat request failed');
			if (!res.body) throw new Error('No response body');

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let assistantText = '';

			// Add a temporary streaming message
			const tempId = '__streaming__';
			chatMessages = [
				...chatMessages,
				{ id: tempId, role: 'assistant', content: '', parentId: userMsg?.id, createdAt: new Date().toISOString() }
			];

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				// Parse SSE data lines
				const lines = chunk.split('\n');
				for (const line of lines) {
					if (line.startsWith('0:')) {
						// Text content
						try {
							const text = JSON.parse(line.slice(2));
							assistantText += text;
							chatMessages = chatMessages.map((m) =>
								m.id === tempId ? { ...m, content: assistantText } : m
							);
							scrollToBottom();
						} catch {}
					}
				}
			}

			// Save the completed AI message
			if (assistantText) {
				const aiMsg = await saveMessage('assistant', assistantText, userMsg?.id || null, citations.length > 0 ? citations : undefined);
				if (aiMsg) {
					chatMessages = chatMessages.map((m) =>
						m.id === tempId ? aiMsg : m
					);
				}
			}

			// Update conversation title if it's the first message
			if (activeMessages.length <= 1 && currentConversationId) {
				await fetch(`/api/conversations/${currentConversationId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: text.slice(0, 50) })
				});
				await loadConversations();
			}
		} catch (err) {
			console.error('Chat error:', err);
			// Remove temp message on error
			chatMessages = chatMessages.filter((m) => m.id !== '__streaming__');
		} finally {
			isStreaming = false;
		}
	}

	// ── Branch operations ──
	async function handleEdit(messageIndex: number, newContent: string) {
		const msg = activeMessages[messageIndex];
		if (!msg) return;

		// Create a new branch: save as a new user message with the same parent
		const userMsg = await saveMessage('user', newContent, msg.parentId, undefined, (msg.branchInfo?.total ?? 0));
		if (userMsg) {
			chatMessages = [...chatMessages, userMsg];
			// Switch to the new branch
			const parent = msg.parentId || '__root__';
			const siblings = chatMessages.filter((m) => (m.parentId || '__root__') === parent);
			activeBranch.set(parent, siblings.length - 1);
			activeBranch = new Map(activeBranch);
		}

		// Now stream AI response for the new branch
		inputValue = '';
		isStreaming = true;

		try {
			const contextMessages = activeMessages
				.slice(0, messageIndex)
				.concat([userMsg])
				.filter(Boolean)
				.map((m: any) => ({ role: m.role, content: m.content }));

			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: contextMessages })
			});

			if (!res.ok || !res.body) throw new Error('Chat failed');

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let assistantText = '';
			const tempId = '__streaming__';

			chatMessages = [
				...chatMessages,
				{ id: tempId, role: 'assistant', content: '', parentId: userMsg?.id, createdAt: new Date().toISOString() }
			];

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				const chunk = decoder.decode(value, { stream: true });
				for (const line of chunk.split('\n')) {
					if (line.startsWith('0:')) {
						try {
							assistantText += JSON.parse(line.slice(2));
							chatMessages = chatMessages.map((m) =>
								m.id === tempId ? { ...m, content: assistantText } : m
							);
							scrollToBottom();
						} catch {}
					}
				}
			}

			if (assistantText) {
				const aiMsg = await saveMessage('assistant', assistantText, userMsg?.id);
				if (aiMsg) {
					chatMessages = chatMessages.map((m) => (m.id === tempId ? aiMsg : m));
				}
			}
		} catch (err) {
			chatMessages = chatMessages.filter((m) => m.id !== '__streaming__');
		} finally {
			isStreaming = false;
		}
	}

	async function handleRegenerate(messageIndex: number) {
		const msg = activeMessages[messageIndex];
		if (!msg || msg.role !== 'assistant') return;

		const parentId = msg.parentId;
		isStreaming = true;

		try {
			const contextMessages = activeMessages
				.slice(0, messageIndex)
				.filter(Boolean)
				.map((m: any) => ({ role: m.role, content: m.content }));

			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: contextMessages })
			});

			if (!res.ok || !res.body) throw new Error('Chat failed');

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let assistantText = '';
			const tempId = '__regen__';

			chatMessages = [
				...chatMessages,
				{ id: tempId, role: 'assistant', content: '', parentId, createdAt: new Date().toISOString() }
			];

			// Switch to the new branch
			const parent = parentId || '__root__';
			const siblings = chatMessages.filter((m) => (m.parentId || '__root__') === parent && m.role === 'assistant');
			activeBranch.set(parent, siblings.length - 1);
			activeBranch = new Map(activeBranch);

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				const chunk = decoder.decode(value, { stream: true });
				for (const line of chunk.split('\n')) {
					if (line.startsWith('0:')) {
						try {
							assistantText += JSON.parse(line.slice(2));
							chatMessages = chatMessages.map((m) =>
								m.id === tempId ? { ...m, content: assistantText } : m
							);
							scrollToBottom();
						} catch {}
					}
				}
			}

			if (assistantText) {
				const aiMsg = await saveMessage('assistant', assistantText, parentId);
				if (aiMsg) {
					chatMessages = chatMessages.map((m) => (m.id === tempId ? aiMsg : m));
				}
			}
		} catch {
			chatMessages = chatMessages.filter((m) => m.id !== '__regen__');
		} finally {
			isStreaming = false;
		}
	}

	function handleBranchNav(parentId: string | null, direction: 'prev' | 'next') {
		const key = parentId || '__root__';
		const siblings = chatMessages.filter((m) => (m.parentId || '__root__') === key);
		const current = activeBranch.get(key) ?? 0;
		const next = direction === 'next' ? Math.min(current + 1, siblings.length - 1) : Math.max(current - 1, 0);
		activeBranch.set(key, next);
		activeBranch = new Map(activeBranch);
	}

	function formatTime(dateStr: string) {
		if (!dateStr) return '';
		try {
			return new Date(dateStr).toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
		} catch {
			return '';
		}
	}

	function scrollToBottom() {
		requestAnimationFrame(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		});
	}
</script>

<svelte:head>
	<title>AI Chat - AuthApp</title>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
	/>
</svelte:head>

<div class="h-[calc(100vh-4rem)] flex">
	<!-- Sidebar -->
	<div
		class="flex-shrink-0 transition-all duration-300 {sidebarOpen
			? 'w-72'
			: 'w-0'} overflow-hidden"
	>
		<div class="w-72 h-full flex flex-col bg-white/50 backdrop-blur-xl border-r border-white/50">
			<!-- New Chat Button -->
			<div class="p-3">
				<button
					onclick={createConversation}
					class="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/></svg
					>
					New Chat
				</button>
			</div>

			<!-- Search -->
			<div class="px-3 pb-2">
				<input
					bind:value={searchQuery}
					placeholder="Search chats..."
					class="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/70 text-sm focus:border-indigo-300 focus:outline-none transition-colors"
				/>
			</div>

			<!-- Conversations List -->
			<div class="flex-1 overflow-y-auto px-2 space-y-0.5">
				{#each filteredConversations as convo}
					<div
						class="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 {currentConversationId ===
						convo.id
							? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
							: 'hover:bg-gray-50 text-gray-700'}"
					>
						<button
							class="flex-1 text-left min-w-0"
							onclick={() => loadConversation(convo.id)}
						>
							<div class="text-sm font-medium truncate">{convo.title}</div>
							<div class="text-[10px] text-gray-400 mt-0.5">
								{new Date(convo.updatedAt).toLocaleDateString()}
							</div>
						</button>
						<button
							onclick={() => deleteConversation(convo.id)}
							class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 hover:text-red-500 transition-all"
						>
							<svg
								class="h-3.5 w-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/></svg
							>
						</button>
					</div>
				{/each}

				{#if filteredConversations.length === 0}
					<div class="text-center py-8 text-gray-400 text-sm">
						{searchQuery ? 'No chats found' : 'No conversations yet'}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main Chat Area -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Chat Header -->
		<div
			class="flex items-center gap-3 px-4 py-3 border-b border-white/50 bg-white/30 backdrop-blur-sm"
		>
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
			>
				<svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h16"
					/></svg
				>
			</button>
			<div>
				<h1 class="text-lg font-bold gradient-text">AI Chat</h1>
				<p class="text-xs text-gray-400">Powered by Gemini + RAG</p>
			</div>
		</div>

		<!-- Messages -->
		<div bind:this={chatContainer} class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
			{#if activeMessages.length === 0}
				<div class="flex flex-col items-center justify-center h-full text-gray-400">
					<svg
						class="h-16 w-16 mb-4 opacity-30"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
						/>
					</svg>
					<p class="text-lg font-medium">Start a conversation</p>
					<p class="text-sm mt-1">
						Upload documents for RAG-powered answers, or just chat freely.
					</p>
				</div>
			{/if}

			{#each activeMessages as msg, i}
				<ChatMessage
					role={msg.role}
					content={msg.content}
					citations={msg.role === 'assistant' && msg.citations
						? (typeof msg.citations === 'string' ? JSON.parse(msg.citations) : msg.citations)
						: i === activeMessages.length - 1 && msg.role === 'assistant'
							? citations
							: []}
					timestamp={formatTime(msg.createdAt)}
					isStreaming={isStreaming && i === activeMessages.length - 1 && msg.role === 'assistant'}
					onEdit={msg.role === 'user' && !isStreaming ? (newContent) => handleEdit(i, newContent) : undefined}
					onRegenerate={msg.role === 'assistant' && !isStreaming ? () => handleRegenerate(i) : undefined}
					branchInfo={msg.branchInfo}
					onBranchNav={msg.branchInfo ? (dir) => handleBranchNav(msg.parentId, dir) : undefined}
				/>
			{/each}

			{#if isStreaming && (activeMessages.length === 0 || activeMessages[activeMessages.length - 1]?.role === 'user')}
				<div class="flex justify-start">
					<div class="bg-white/80 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm border border-gray-100">
						<div class="text-xs font-semibold mb-1.5 text-gray-400">AI Assistant</div>
						<div class="flex items-center gap-1.5">
							<div
								class="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"
								style="animation-delay: 0ms;"
							></div>
							<div
								class="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"
								style="animation-delay: 150ms;"
							></div>
							<div
								class="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"
								style="animation-delay: 300ms;"
							></div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Input Form -->
		<div class="px-4 pb-4 pt-2">
			<form onsubmit={handleSubmit} class="flex gap-3">
				<input
					bind:value={inputValue}
					placeholder="Ask anything... Your uploaded documents will be used as context."
					disabled={isStreaming}
					class="flex-1 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:outline-none transition-all duration-300 disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={isStreaming || !inputValue.trim()}
					class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300"
				>
					{#if isStreaming}
						<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
								fill="none"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					{:else}
						Send
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>
