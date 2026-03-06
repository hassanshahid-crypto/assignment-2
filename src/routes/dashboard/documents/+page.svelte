<script lang="ts">
	import { onMount } from 'svelte';

	let documents = $state<any[]>([]);
	let uploading = $state(false);
	let error = $state('');
	let success = $state('');
	let fileInput: HTMLInputElement;

	onMount(loadDocuments);

	async function loadDocuments() {
		const res = await fetch('/api/documents');
		if (res.ok) {
			const data = await res.json();
			documents = data.documents;
		}
	}

	async function handleUpload(e: Event) {
		e.preventDefault();
		error = '';
		success = '';

		const file = fileInput?.files?.[0];
		if (!file) {
			error = 'Please select a file';
			return;
		}

		uploading = true;
		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch('/api/documents', {
				method: 'POST',
				body: formData
			});

			if (res.ok) {
				const data = await res.json();
				success = `Uploaded "${data.document.name}" - ${data.document.chunks} chunks created`;
				fileInput.value = '';
				await loadDocuments();
			} else {
				const data = await res.json().catch(() => null);
				error = data?.message || 'Upload failed';
			}
		} catch (err) {
			error = 'Upload failed. Make sure the embedding service is running.';
		} finally {
			uploading = false;
		}
	}

	async function deleteDocument(id: string) {
		if (!confirm('Delete this document and all its chunks?')) return;

		const res = await fetch('/api/documents', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ documentId: id })
		});

		if (res.ok) {
			await loadDocuments();
			success = 'Document deleted';
		}
	}
</script>

<svelte:head>
	<title>Documents - AuthApp</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
	<!-- Header -->
	<div class="mb-10 animate-fade-in-up">
		<div class="flex items-center gap-4 mb-2">
			<div
				class="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
			>
				<svg
					class="h-6 w-6 text-white"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
					/>
				</svg>
			</div>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Documents</h1>
				<p class="text-gray-500">
					Upload text files for RAG-powered AI chat. Documents are chunked and embedded
					for retrieval.
				</p>
			</div>
		</div>
	</div>

	{#if error}
		<div
			class="alert-enter mb-6 rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3"
		>
			<svg
				class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
				/></svg
			>
			<p class="text-sm font-medium text-red-700">{error}</p>
		</div>
	{/if}

	{#if success}
		<div
			class="alert-enter mb-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3"
		>
			<svg
				class="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>
			<p class="text-sm font-medium text-emerald-700">{success}</p>
		</div>
	{/if}

	<!-- Upload Form -->
	<div
		class="card-hover bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm shadow-indigo-100/20 border border-white/50 p-8 mb-8 animate-fade-in-up stagger-1"
	>
		<div class="flex items-center gap-3 mb-6">
			<div class="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
				<svg
					class="h-5 w-5 text-emerald-600"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/></svg
				>
			</div>
			<h2 class="text-xl font-bold text-gray-900">Upload Document</h2>
		</div>

		<form onsubmit={handleUpload} class="flex items-end gap-4">
			<div class="flex-1">
				<label for="file" class="block text-sm font-medium text-gray-700 mb-1.5"
					>Select a text file (.txt, .md, .csv)</label
				>
				<input
					bind:this={fileInput}
					id="file"
					type="file"
					accept=".txt,.md,.csv,.text"
					class="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors cursor-pointer"
				/>
			</div>
			<button
				type="submit"
				disabled={uploading}
				class="btn-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
			>
				{#if uploading}
					<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
					Uploading...
				{:else}
					Upload & Embed
				{/if}
			</button>
		</form>
	</div>

	<!-- Documents List -->
	<div
		class="bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm shadow-indigo-100/20 border border-white/50 overflow-hidden animate-fade-in-up stagger-2"
	>
		<div class="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
					<svg
						class="h-5 w-5 text-emerald-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
						/></svg
					>
				</div>
				<h2 class="text-lg font-bold text-gray-900">Your Documents</h2>
			</div>
			<span class="text-sm text-gray-500">{documents.length} total</span>
		</div>

		{#if documents.length === 0}
			<div class="py-12 text-center text-gray-400">
				<svg
					class="h-12 w-12 mx-auto mb-3 opacity-50"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/></svg
				>
				<p class="text-sm font-medium">No documents yet</p>
				<p class="text-xs mt-1">Upload a text file above to get started</p>
			</div>
		{:else}
			<div class="divide-y divide-gray-50">
				{#each documents as doc}
					<div class="flex items-center justify-between px-8 py-4 table-row-hover">
						<div class="flex items-center gap-4">
							<div
								class="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center"
							>
								<svg
									class="h-5 w-5 text-emerald-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/></svg
								>
							</div>
							<div>
								<div class="text-sm font-semibold text-gray-900">{doc.name}</div>
								<div class="text-xs text-gray-400">
									{doc.type} &middot;
									{new Date(doc.createdAt).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric'
									})}
								</div>
							</div>
						</div>
						<button
							onclick={() => deleteDocument(doc.id)}
							class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 transition-all duration-200"
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
							Delete
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
