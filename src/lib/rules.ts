import type { Rule, Schema } from './types.js';

const EMAIL_REGEX =
	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const IPV4_REGEX =
	/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const IPV6_REGEX =
	/^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

const URI_REGEX =
	/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

export function email(): Rule<string> {
	return {
		name: 'email',
		validate: async function (value: string): Promise<boolean> {
			return EMAIL_REGEX.test(value);
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

/**
 * Whether a value is not empty.
 */
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

/**
 * Whether a value is the same as in another schema.
 */
export function sameAs(schema: Schema<unknown, string | number>): Rule<string | number> {
	return {
		name: 'sameAs',
		validate: async function (value: string | number): Promise<boolean> {
			return schema.result() === value;
		}
	};
}

/**
 * Whether a value matches the pattern.
 */
export function regex(pattern: RegExp): Rule<string> {
	return {
		name: 'regex',
		validate: async function (value: string): Promise<boolean> {
			return Boolean(value.match(pattern));
		}
	};
}

/**
 * Check if field value matches at least one of listed values.
 */
export function oneOf(values: Array<string | number>): Rule<string | number> {
	return {
		name: 'oneOf',
		validate: async function (value: string | number): Promise<boolean> {
			return values.includes(value);
		}
	};
}

/**
 * Are all of array elements unique.
 */
export function allUnique(): Rule<Array<string | number>> {
	return {
		name: 'allUnique',
		validate: async function (values: Array<string | number>): Promise<boolean> {
			return new Set(values).size === values.length;
		}
	};
}

/**
 * Inverts the result of any rule. Name of the rule is 'notCapitalizedNameOfRule'.
 *
 * @param rule
 */
export function not<ValueType>(rule: Rule<ValueType>): Rule<ValueType> {
	return {
		name: 'not' + rule.name.charAt(0).toUpperCase() + rule.name.slice(1),
		validate: async function (value: ValueType): Promise<boolean> {
			return !(await rule.validate(value));
		}
	};
}

/**
 * Whether a field consists only of digits.
 */
export function digital(): Rule<string> {
	return {
		name: 'digital',
		validate: async function (value: string): Promise<boolean> {
			return /^[0-9]+$/.test(value);
		}
	};
}

/**
 * Is value a valid UUID.
 */
export function uuid(): Rule<string> {
	return {
		name: 'uuid',
		validate: async function (value: string): Promise<boolean> {
			return UUID_REGEX.test(value);
		}
	};
}

/**
 * Is value a valid IP v4 or v6. If version not specified then matching any version will be checked.
 */
export function ip(version: 'v4' | 'v6' | undefined = undefined): Rule<string> {
	return {
		name: 'ip',
		validate: async function (value: string): Promise<boolean> {
			switch (version) {
				case 'v4':
					return IPV4_REGEX.test(value);
				case 'v6':
					return IPV6_REGEX.test(value);
				default:
					return IPV4_REGEX.test(value) || IPV6_REGEX.test(value);
			}
		}
	};
}

/**
 * Is value a valid URL.
 */
export function uri(): Rule<string> {
	return {
		name: 'uri',
		validate: async function (value: string): Promise<boolean> {
			return URI_REGEX.test(value);
		}
	};
}

/**
 * Whether a string starts with specified text.
 */
export function startsWith(start: string): Rule<string> {
	return {
		name: 'startsWith',
		validate: async function (value: string): Promise<boolean> {
			return value.startsWith(start);
		}
	};
}

/**
 * Whether a string ends with specified text.
 */
export function endsWith(start: string): Rule<string> {
	return {
		name: 'endsWith',
		validate: async function (value: string): Promise<boolean> {
			return value.endsWith(start);
		}
	};
}
