# svelte-schemas
[>> **Github** <<](https://github.com/radynsade/svelte-schemas)

## Introduction

Svelte data validation and structuring library. The main motivation is to make dynamic forms, where amount of fields and their structure may change depending on previous input, easily to work with, but can be used for forms of any complexity.
Approach is do not distinguish between fields and form, everything is a value, can be a part of another value and have sub-values.

## Schemas

### Common properties and methods

- **schema.validate()** — run validation.
- **schema.result()** — value in the store of schema may differ from the value we want, therefore use this method to get a ready-to-use value.
- **$schema.value** — current value of schema, not the raw data.
- **$schema.errors** — an array of broken rules names.
- **$schema.valid** — if result value does not brake any rules.

### Field

Simple schema for primitive values, result value is the same as value in the store.

```svelte
<script lang="ts">
	import { field } from 'svelte-schemas';
	import { min } from 'svelte-schemas/rules';

	const username = field('', [min(3)]);
	const errorMessages = {
		min: 'Cannot be less than 3 characters'
	};
</script>

<input type="text" bind:value={$username.value} class:error={!$username.valid} />
{#each $username.errors as error}
	{errorMessages[error]}
{/each}

<style>
	input {
		border: 1px solid #000000;
	}

	.error {
		border-color: #ff0000;
	}
</style>
```

### List

Value in the store contains an array of schemas, has 'add()' and 'delete(index)' methods, 'result' method will collect and return results from schemas inside.

**Example (MainForm.svelte):**

```svelte
<script lang="ts">
	import { field } from 'svelte-schemas';
	import { email, max } from 'svelte-schemas/rules';
	import NestedForm from '$lib/NestedForm.svelte';

	function createEmailField(value: string): Field<email> {
		return field(value, [email()]);
	}

	const emails = list(createEmailField, '', [], [min(1), max(5)]);

	// If you want to add a new email field on any DOM event, wrap 'add' method
	// into a function, otherwise you'll get an error, because method relies on
	// 'this'.
	function addEmail(): void {
		emails.add();
	}

	// The same for 'delete' method.
	function deleteEmail(index: number): void {
		emails.delete(index);
	}
</script>

<button on:click={addEmail}>Add email:</button>
{#each emails as mail, i}
	<NestedForm {mail} index={i} onDelete={deleteEmail} />
{/each}
```

**Example (NestedForm.svelte):**

```svelte
<script lang="ts">
	import type { Field } from 'svelte-schemas';

	export let email: Field;
	export let index: number;
	export let onDelete: (index: number) => void;
</script>

...
```

### Struct

Value in the store is an object with schemas, 'result' method will return an object with results by keys.

**Example:**

```svelte
<script lang="ts">
	import { field, struct } from 'svelte-schemas';

	const firstname = field('');
	const lastname = field('');
	const person = struct({
		firstname,
		lastname
	});
</script>

...
```

## Rules

### Default

- **min(than: number, included: number)**;
- **max(than: number, included: number)**;
- **required()** — check if value is not empty, but '0' is not considered as an empty, use _min_ instead;
- **sameAs(schema)** — if this value is the same as in specified schema. Only for strings and numbers;
- **regex(pattern: RegExp)**;
- **email()**;
- **oneOf(values: Array<string | number>)**;
- **allUnique()** — check if all values in an array are unique, only for arrays of strings or numbers;

_mix_ and _max_ rules will compare length if value is an array or string.

### Custom rule

Use constructor function to create a custom rule.

**Example:**

```typescript
export function regex(pattern: RegExp): Rule<string> {
	return {
		name: 'regex',
		validate: async function (value: string): Promise<boolean> {
			return !!value.match(pattern);
		}
	};
}
```
