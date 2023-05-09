<script lang="ts">
	import TextField from '$lib/example/TextField.svelte';
	import type { Guest } from '$lib/example/types.ts';
	import type { Struct } from '$lib/index.ts';

	export let guest: Struct<Guest>;
	export let index: number;
	export let deleter: (i: number) => void;

	const errorMessages = {
		min: 'Cannot be less than 2 characters.'
	};

	const { firstname, lastname } = $guest.value;
</script>

<div class="container">
	<TextField
		bind:value={$firstname.value}
		title="Firstname"
		errors={$firstname.errors}
		messages={errorMessages}
		type="text"
		placeholder="John"
	/>
	<TextField
		bind:value={$lastname.value}
		title="Lastname"
		errors={$lastname.errors}
		messages={errorMessages}
		type="text"
		placeholder="Cena"
	/>
	<button on:click={() => deleter(index)}>Delete</button>
</div>

<style>
	.container {
		border: 1px solid gray;
		padding: 8px;
	}
</style>
