import type { Field } from '$lib/index.ts';

export interface GuestForm {
	firstname: Field<string>;
	lastname: Field<string>;
}

export interface Guest {
	firstname: string;
	lastname: string;
}
