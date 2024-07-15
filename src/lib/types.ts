import type { Writable } from 'svelte/store';

export interface Rule<Value> {
	readonly name: string;
	readonly validate: (value: Value) => Promise<boolean>;
}

export interface State<Value> {
	errors: string[];
	valid: boolean;
	dirty: boolean;
	value: Value;
}

/**
 * @deprecated Use State interface instead.
 */
export type SchemaData<Value> = Omit<State<Value>, 'dirty'>;

export interface Schema<Value, Result> extends Omit<Writable<State<Value>>, 'set'> {
	validate: () => Promise<boolean>;
	result: () => Result;
	set: (value: Value) => void;
}

export type Field<Value> = Schema<Value, Value>;

export interface List<Value, Result> extends Schema<Schema<Value, Result>[], Result[]> {
	add: () => void;
	delete: (index: number) => void;
}

export type StructResult<Value> = {
	[Key in keyof Value]: Value[Key] extends Schema<infer _, infer Result> ? Result : never;
};

export type StructValue<Value> = {
	[Key in keyof Value]: Value[Key] extends Schema<infer V, infer R> ? Schema<V, R> : never;
};

export type Struct<Value extends StructValue<Value>> = Schema<Value, StructResult<Value>>;
