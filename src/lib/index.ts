import { get, writable, type Writable } from 'svelte/store';

/*
	Common
*/

export interface Rule<ValueType> {
	readonly name: string;
	readonly validate: (value: ValueType) => Promise<boolean>;
}

export interface SchemaData<ValueType> {
	errors: string[];
	valid: boolean;
	value: ValueType;
}

export interface Schema<StoreType, ResultType>
	extends Omit<Writable<SchemaData<StoreType>>, 'set'> {
	validate(this: Schema<StoreType, ResultType>): Promise<boolean>;
	result(): ResultType;
	set(this: Schema<StoreType, ResultType>, value: StoreType): void;
}

function isSchemaData(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const keys = Object.keys(value);

	if (keys.length !== 3) {
		return false;
	}

	const required = ['errors', 'valid', 'value'];

	for (const key of keys) {
		if (!required.includes(key)) {
			return false;
		}
	}

	return true;
}

async function validate<StoreType, ResultType>(
	schema: Schema<StoreType, ResultType>,
	rules: Rule<ResultType>[]
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

type Base<StoreType, ResultType> = Omit<Schema<StoreType, ResultType>, 'result' | 'validate'>;

function base<StoreType, ResultType>(value: StoreType): Base<StoreType, ResultType> {
	const store: Writable<SchemaData<StoreType>> = writable({
		errors: [],
		value,
		valid: true
	});

	const { subscribe, update, set: _set } = store;

	return {
		subscribe,
		update,
		set(this: Schema<StoreType, ResultType>, value: StoreType): void {
			const data = get(store);

			if (isSchemaData(value)) {
				const storeData = value as unknown as SchemaData<StoreType>;

				_set({
					...data,
					value: storeData.value
				});
			} else {
				_set({
					...data,
					value
				});
			}

			this.validate();
		}
	};
}

/*
	Field
*/

export type Field<ValueType> = Schema<ValueType, ValueType>;

export function field<ValueType>(
	value: ValueType,
	rules: Rule<ValueType>[] = []
): Field<ValueType> {
	return {
		...base(value, rules),
		validate(this: Field<ValueType>): Promise<boolean> {
			return validate(this, rules);
		},
		result(this: Field<ValueType>): ValueType {
			return get(this).value;
		}
	};
}

/*
	List
*/

export interface List<StoreType, ResultType>
	extends Schema<Schema<StoreType, ResultType>[], ResultType[]> {
	add(this: List<StoreType, ResultType>): void;
	delete(this: List<StoreType, ResultType>, index: number): void;
}

/**
 * @param builder item schema's constructor, called on new item creation.
 * @param initialValue default value which will be applied to the new item after creation.
 * @param values initial values.
 * @param rules validation rules applied to the whole list.
 * @returns
 */
export function list<StoreType, ResultType>(
	builder: (value: ResultType) => Schema<StoreType, ResultType>,
	initialValue: ResultType,
	values: ResultType[] = [],
	rules: Rule<ResultType[]>[] = []
): List<StoreType, ResultType> {
	let schemas: Schema<StoreType, ResultType>[] = [];

	for (const value of values) {
		schemas = [...schemas, builder(value)];
	}

	return {
		...base(schemas, rules),
		validate(this: List<StoreType, ResultType>): Promise<boolean> {
			const currentSchemas = get(this).value;

			for (const schema of currentSchemas) {
				schema.validate();
			}

			return validate(this, rules);
		},
		result(this: List<StoreType, ResultType>): ResultType[] {
			return get(this).value.map((schema) => schema.result());
		},
		add(this: List<StoreType, ResultType>): void {
			this.update((state) => ({
				...state,
				value: [...state.value, builder(initialValue)]
			}));
		},
		delete(this: List<StoreType, ResultType>, index: number): void {
			this.update((state) => ({
				...state,
				value: [...state.value.slice(0, index), ...state.value.slice(index + 1)]
			}));
		}
	};
}

/*
	Struct
*/

export type StructStore<StructType> = {
	[Key in keyof StructType]: Schema<unknown, StructType[Key]>;
};

export type Struct<StructType> = Schema<StructStore<StructType>, StructType>;

export function struct<StructType>(
	schemas: StructStore<StructType>,
	rules: Rule<StructType>[] = []
): Struct<StructType> {
	return {
		...base(schemas, rules),
		validate(this: Struct<StructType>): Promise<boolean> {
			const currentSchemas = get(this).value;

			for (const key in currentSchemas) {
				currentSchemas[key].validate();
			}

			return validate(this, rules);
		},
		result(this: Struct<StructType>): StructType {
			const result: Record<string, unknown> = {};
			const currentSchemas = get(this).value;

			for (const key in currentSchemas) {
				result[key] = currentSchemas[key].result();
			}

			return result as StructType;
		}
	};
}
