import type { Field } from '$lib/types.js';

export interface GuestForm {
	firstname: Field<string>;
	lastname: Field<string>;
}

export interface Guest {
	firstname: string;
	lastname: string;
}
