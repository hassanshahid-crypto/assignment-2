<script lang="ts">
	import { onMount } from 'svelte';

	let {
		role,
		content,
		citations = [],
		timestamp = '',
		isStreaming = false,
		onRegenerate = undefined,
		onEdit = undefined,
		onBranchNav = undefined,
		branchInfo = undefined
	}: {
		role: string;
		content: string;
		citations?: any[];
		timestamp?: string;
		isStreaming?: boolean;
		onRegenerate?: (() => void) | undefined;
		onEdit?: ((newContent: string) => void) | undefined;
		onBranchNav?: ((direction: 'prev' | 'next') => void) | undefined;
		branchInfo?: { current: number; total: number } | undefined;
	} = $props();

	let renderedHtml = $state('');
	let copied = $state(false);
	let editing = $state(false);
	let editText = $state('');
	let messageEl: HTMLElement;

	// Render markdown
	async function renderMarkdown(text: string) {
		try {
			const { marked } = await import('marked');
			marked.setOptions({
				breaks: true,
				gfm: true
			});
			renderedHtml = await marked.parse(text);
		} catch {
			renderedHtml = text.replace(/\n/g, '<br>');
		}
	}

	$effect(() => {
		if (role === 'assistant' && content) {
			renderMarkdown(content);
		}
	});

	// Highlight code blocks after render
	$effect(() => {
		if (renderedHtml && messageEl) {
			requestAnimationFrame(() => {
				const codeBlocks = messageEl.querySelectorAll('pre code');
				codeBlocks.forEach(async (block) => {
					try {
						const hljs = (await import('highlight.js')).default;
						hljs.highlightElement(block as HTMLElement);
					} catch {}
				});
			});
		}
	});

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(content);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {}
	}

	function startEdit() {
		editText = content;
		editing = true;
	}

	function submitEdit() {
		if (editText.trim() && onEdit) {
			onEdit(editText.trim());
		}
		editing = false;
	}

	function cancelEdit() {
		editing = false;
	}
</script>

<div class="flex {role === 'user' ? 'justify-end' : 'justify-start'} group">
	<div
		class="max-w-[85%] {role === 'user'
			? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md'
			: 'bg-white/80 text-gray-800 rounded-2xl rounded-bl-md border border-gray-100'} px-5 py-3.5 shadow-sm"
	>
		<!-- Header -->
		<div class="flex items-center justify-between mb-1.5">
			<span
				class="text-xs font-semibold {role === 'user' ? 'text-indigo-200' : 'text-gray-400'}"
			>
				{role === 'user' ? 'You' : 'AI Assistant'}
			</span>
			{#if timestamp}
				<span
					class="text-[10px] {role === 'user' ? 'text-indigo-300' : 'text-gray-300'} ml-3"
				>
					{timestamp}
				</span>
			{/if}
		</div>

		<!-- Content -->
		{#if editing}
			<div class="space-y-2">
				<textarea
					bind:value={editText}
					class="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-white/50"
					rows="3"
				></textarea>
				<div class="flex gap-2">
					<button
						onclick={submitEdit}
						class="px-3 py-1 text-xs font-semibold bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
					>
						Save & Submit
					</button>
					<button
						onclick={cancelEdit}
						class="px-3 py-1 text-xs font-semibold bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		{:else if role === 'assistant'}
			<div
				bind:this={messageEl}
				class="text-sm leading-relaxed prose prose-sm max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-inner prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-headings:text-gray-900 prose-a:text-indigo-600"
			>
				{@html renderedHtml}
				{#if isStreaming}
					<span class="inline-block w-2 h-4 bg-indigo-500 animate-pulse rounded-sm ml-0.5"
					></span>
				{/if}
			</div>
		{:else}
			<div class="text-sm whitespace-pre-wrap leading-relaxed">{content}</div>
		{/if}

		<!-- Citations -->
		{#if citations && citations.length > 0 && role === 'assistant'}
			<div class="mt-3 pt-3 border-t border-gray-100">
				<div class="text-xs font-semibold text-gray-400 mb-1.5">Sources</div>
				<div class="flex flex-wrap gap-1.5">
					{#each citations as citation, i}
						<span
							class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-medium"
							title={citation.preview || citation.content}
						>
							<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/></svg
							>
							{citation.documentName} (chunk {citation.chunkIndex})
						</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Actions -->
		<div
			class="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
		>
			{#if role === 'assistant'}
				<button
					onclick={copyToClipboard}
					class="p-1 rounded-md hover:bg-gray-100 transition-colors"
					title="Copy to clipboard"
				>
					{#if copied}
						<svg class="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/></svg
						>
					{:else}
						<svg class="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/></svg
						>
					{/if}
				</button>
				{#if onRegenerate}
					<button
						onclick={onRegenerate}
						class="p-1 rounded-md hover:bg-gray-100 transition-colors"
						title="Regenerate"
					>
						<svg class="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/></svg
						>
					</button>
				{/if}
			{/if}
			{#if role === 'user' && onEdit}
				<button
					onclick={startEdit}
					class="p-1 rounded-md hover:bg-white/20 transition-colors"
					title="Edit message"
				>
					<svg class="h-3.5 w-3.5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/></svg
					>
				</button>
			{/if}

			<!-- Branch navigation -->
			{#if branchInfo && branchInfo.total > 1}
				<div class="flex items-center gap-0.5 ml-1">
					<button
						onclick={() => onBranchNav?.('prev')}
						class="p-0.5 rounded hover:bg-gray-100 transition-colors"
						disabled={branchInfo.current === 0}
					>
						<svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/></svg
						>
					</button>
					<span class="text-[10px] text-gray-400 font-medium">
						{branchInfo.current + 1}/{branchInfo.total}
					</span>
					<button
						onclick={() => onBranchNav?.('next')}
						class="p-0.5 rounded hover:bg-gray-100 transition-colors"
						disabled={branchInfo.current === branchInfo.total - 1}
					>
						<svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/></svg
						>
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
