import type { Rule, Schema } from './index.js';

const EMAIL_REGEX =
	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function email(): Rule<string> {
	return {
		name: 'email',
		validate: async function (value: string): Promise<boolean> {
			return !!value.match(EMAIL_REGEX);
		}
	};
}

function getComparable(value: number | string | unknown[]): number {
	switch (typeof value) {
		case 'string':
		case 'object':
			if (!Array.isArray(value)) {
				return Object.keys(value).length;
			}

			return value.length;
		case 'number':
			return value;
		default:
			return NaN;
	}
}

function compare(
	value: number | string | unknown[],
	greater: boolean,
	than: number,
	included: boolean
): boolean {
	const comparable = getComparable(value);

	if (isNaN(comparable)) {
		return false;
	}

	return greater
		? included
			? comparable >= than
			: comparable > than
		: included
		? comparable <= than
		: comparable < than;
}

export function min(than: number, included = true): Rule<number | string | unknown[]> {
	return {
		name: 'min',
		validate: async function (value: number | string | unknown[]): Promise<boolean> {
			return compare(value, true, than, included);
		}
	};
}

export function max(than: number, included = true): Rule<number | string | unknown[]> {
	return {
		name: 'max',
		validate: async function (value: number | string | unknown[]): Promise<boolean> {
			return compare(value, false, than, included);
		}
	};
}

export function required(): Rule<
	string | number | null | undefined | unknown[] | Record<string, unknown>
> {
	return {
		name: 'required',
		validate: async function (
			value: string | number | null | undefined | unknown[] | Record<string, unknown>
		): Promise<boolean> {
			if (value == null || value === '') {
				return false;
			}

			if (typeof value === 'object') {
				if (Array.isArray(value)) {
					return value.length > 0;
				}

				for (const _ in value) {
					return true;
				}

				return false;
			}

			return true;
		}
	};
}

export function sameAs(schema: Schema<unknown, string | number>): Rule<string | number> {
	return {
		name: 'sameAs',
		validate: async function (value: string | number): Promise<boolean> {
			return schema.result() === value;
		}
	};
}

export function regex(pattern: RegExp): Rule<string> {
	return {
		name: 'regex',
		validate: async function (value: string): Promise<boolean> {
			return !!value.match(pattern);
		}
	};
}

export function oneOf(values: Array<string | number>): Rule<string | number> {
	return {
		name: 'oneOf',
		validate: async function (value: string | number): Promise<boolean> {
			return values.includes(value);
		}
	};
}

export function allUnique(): Rule<Array<string|number>> {
	return {
		name: 'allUnique',
		validate: async function (values: Array<string | number>): Promise<boolean> {
			return new Set(values).size === values.length;
		}
	};
}

/**
 * Inverts the result of any rule. Name of the rule is 'notCapitalizedNameOfRule'.
 * @param rule
 * @returns
 */
export function not<ValueType>(rule: Rule<ValueType>): Rule<ValueType> {
	return {
		name: 'not' + rule.name.charAt(0).toUpperCase() + rule.name.slice(1),
		validate: async function (value: ValueType): Promise<boolean> {
			return !(await rule.validate(value));
		}
	};
}
