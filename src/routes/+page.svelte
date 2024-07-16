<script lang="ts">
	import TextField from '$lib/example/TextField.svelte';
	import type { Guest } from '$lib/example/types.ts';
	import GuestForm from '$lib/example/GuestForm.svelte';
	import { field, list, struct } from '$lib/index.js';
	import { email, ip, max, min, uri } from '$lib/rules.js';

	const nameErrorMessages = {
		min: 'Name of the event cannot be shorter than 3 characters.'
	};

	const name = field('', [min(3)]);

	const emailErrorMessages = {
		email: 'Invalid email format.'
	};

	const contactEmail = field('', [email()]);
	const website = field('', [uri()]);
	const homeIp = field('', [ip()]);

	function createGuest(guest: Guest) {
		return struct({
			firstname: field(guest.firstname, [min(2)]),
			lastname: field(guest.lastname, [min(2)]),
		});
	}

	const guestsErrorMessages: Record<string, string> = {
		max: 'Maximum amount of guests is 10.'
	};

	const guests = list(createGuest, {firstname: '', lastname: ''}, [], [max(10)]);

	const form = struct({
		name,
		contactEmail,
		guests
	});

	function onSubmit(): void {
		form.validate().then(() => {
			console.log(form.result());
		});
	}
</script>

<h1>Event</h1>
<form class="form" on:submit={onSubmit}>
	<TextField
		title="Name"
		placeholder="My birthday"
		bind:value={$name.value}
		errors={$name.errors}
		messages={nameErrorMessages}
		type="text"
	/>
	<TextField
		title="Contact email"
		placeholder="banana@example.org"
		bind:value={$contactEmail.value}
		errors={$contactEmail.errors}
		messages={emailErrorMessages}
		type="email"
	/>
	<TextField
		title="Website"
		placeholder="https://example.com"
		bind:value={$website.value}
		errors={$website.errors}
		type="text"
	/>
	<TextField
		title="IP"
		placeholder="127.0.0.1"
		bind:value={$homeIp.value}
		errors={$homeIp.errors}
		type="text"
	/>
	<h2>Guests</h2>
	{#each $guests.errors as error}
		<div>{guestsErrorMessages[error]}</div>
	{/each}
	<button type="button" on:click={guests.add}>Add</button>
	{#key $guests.value.length}
		{#each $guests.value as guest, i}
			<GuestForm {guest} index={i} deleter={guests.delete} />
		{/each}
	{/key}
	<button type="submit">Send</button>
</form>

<style>
	.form {
		width: 400px;
		display: grid;
		gap: 8px;
	}
</style>
