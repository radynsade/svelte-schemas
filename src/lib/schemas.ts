import { get, writable, type Writable } from 'svelte/store';
import type {
	Field,
	List,
	Rule,
	Schema,
	State,
	Struct,
	StructValue,
	StructResult
} from './types.js';

function isSchemaData(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const keys = Object.keys(value);

	if (keys.length !== 4) {
		return false;
	}

	const required = ['errors', 'valid', 'value', 'dirty'];

	for (const key of keys) {
		if (!required.includes(key)) {
			return false;
		}
	}

	return true;
}

async function _validate<Value, Result>(
	schema: Omit<Schema<Value, Result>, 'validate'>,
	rules: Rule<Result>[]
): Promise<boolean> {
	const value = schema.result();
	let success = true;
	const errors: string[] = [];

	await Promise.all(
		rules.map(async (v) => {
			if (await v.validate(value)) {
				return;
			}

			if (success) {
				success = false;
			}

			errors.push(v.name);
		})
	);

	schema.update((state) => ({
		...state,
		errors,
		valid: success
	}));

	return success;
}

type Base<Value, Result> = Omit<Schema<Value, Result>, 'result' | 'validate'>;

function base<Value, Result>(value: Value): Base<Value, Result> {
	const store: Writable<State<Value>> = writable({
		errors: [],
		value,
		valid: true,
		dirty: false
	});

	const { subscribe, update, set: _set } = store;

	return {
		subscribe,
		update,
		set: function (value: Value): void {
			const data = get(store);

			if (isSchemaData(value)) {
				const storeData = value as unknown as State<Value>;

				_set({
					...data,
					value: storeData.value,
					dirty: true
				});
			} else {
				_set({
					...data,
					value,
					dirty: true
				});
			}
		}
	};
}

export function field<Value>(rules: Rule<Value>[], initial: Value): Field<Value> {
	const baseSchema = base(initial);

	function result(): Value {
		return get(baseSchema).value;
	}

	const schemaWithResult = {
		...baseSchema,
		result
	};

	function validate(): Promise<boolean> {
		return _validate(schemaWithResult, rules);
	}

	return {
		...schemaWithResult,
		validate,
		result,
		set: function (value: Value) {
			baseSchema.set(value);
			validate();
		}
	};
}

export function list<Value, Result>(
	itemConstructor: (value?: Result) => Schema<Value, Result>,
	rules: Rule<Result[]>[] = [],
	initial: Result[] = []
): List<Value, Result> {
	let schemas: Schema<Value, Result>[] = [];

	for (const value of initial) {
		schemas = [...schemas, itemConstructor(value)];
	}

	const baseSchema = base(schemas);

	function result(): Result[] {
		return get(baseSchema).value.map((schema) => schema.result());
	}

	const schemaWithResult = {
		...baseSchema,
		result
	};

	function validate(): Promise<boolean> {
		const currentSchemas = get(schemaWithResult).value;

		for (const schema of currentSchemas) {
			schema.validate();
		}

		return _validate(schemaWithResult, rules);
	}

	function add(): void {
		baseSchema.update((state) => ({
			...state,
			value: [...state.value, itemConstructor()]
		}));
	}

	function _delete(index: number) {
		baseSchema.update((state) => ({
			...state,
			value: [...state.value.slice(0, index), ...state.value.slice(index + 1)]
		}));
	}

	return {
		...schemaWithResult,
		validate,
		result,
		set: function (value: Schema<Value, Result>[]) {
			baseSchema.set(value);
			validate();
		},
		add,
		delete: _delete
	};
}

export function struct<Value extends StructValue<Value>>(
	schemas: Value,
	rules: Rule<StructResult<Value>>[] = []
): Struct<Value> {
	const baseSchema = base(schemas);

	function result(): StructResult<Value> {
		const result: Record<string, unknown> = {};
		const currentSchemas = get(baseSchema).value;

		for (const key in currentSchemas) {
			result[key] = currentSchemas[key].result();
		}

		return result as StructResult<Value>;
	}

	const schemaWithResult = {
		...baseSchema,
		result
	};

	function validate(): Promise<boolean> {
		const currentSchemas = get(schemaWithResult).value;

		for (const key in currentSchemas) {
			currentSchemas[key].validate();
		}

		return _validate(schemaWithResult, rules);
	}

	return {
		...schemaWithResult,
		validate,
		result,
		set: function (value: Value) {
			baseSchema.set(value);
			validate();
		}
	};
}
