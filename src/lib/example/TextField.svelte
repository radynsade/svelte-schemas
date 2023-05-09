<script lang="ts">
	export let value: string;
	export let title: string;
	export let errors: string[] = [];
	export let messages: Record<string, string> = {};
	export let type: 'email' | 'text' | 'number' | 'tel' = 'text';
	export let placeholder: string | undefined = undefined;
	export let max: number | undefined = undefined;
	export let autocomplete: string | undefined = undefined;

	const ref = (node: HTMLInputElement) => {
		node.type = type;
	};
</script>

<div>
	<label class="field">
		<span class="title">{title}</span>
		<input
			{placeholder}
			maxlength={max}
			{autocomplete}
			class:error={errors.length > 0}
			use:ref
			bind:value
			on:blur
			on:change
			on:keypress
			on:keydown
			on:keyup
			on:input
		/>
	</label>
	<ul class="errors">
		{#each errors as error}
			<li>{messages[error]}</li>
		{/each}
	</ul>
</div>

<style>
	.field {
		display: grid;
		gap: 4px;
	}

	.title {
		font-weight: 500;
	}

	.error {
		border-color: red;
	}

	input {
		border: 2px solid black;
	}
</style>
