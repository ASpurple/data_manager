import * as fs from "https://deno.land/std@0.213.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.213.0/path/mod.ts";

export enum SortMode {
	up,
	down,
}

export interface QueryOption {
	offset?: number;
	limit?: number;
	sortMode?: SortMode;
	sortField?: string;
}

export class DataStore<T> {
	constructor(filePath: string) {
		if (!filePath) {
			throw "file path is empty";
		}
		this.filePath = filePath;
		this.init();
	}

	filePath: string = "";

	init() {
		if (!fs.existsSync(this.filePath)) {
			Deno.mkdirSync(path.dirname(this.filePath), { recursive: true });
			const file = Deno.createSync(this.filePath);
			file.close();
		}
	}

	async readAll(): Promise<T[]> {
		const str = await Deno.readTextFile(this.filePath);
		if (!str) return [];
		try {
			const arr = JSON.parse(str);
			return arr;
		} catch (e) {
			console.error(e);
			return [];
		}
	}

	async writeAll(arr: T[]) {
		const str = JSON.stringify(arr);
		await Deno.writeTextFile(this.filePath, str);
	}

	async insert(...data: T[]) {
		const arr = await this.readAll();
		arr.push(...data);
		await this.writeAll(arr);
	}

	async delete(test: (data: T) => boolean) {
		const arr = await this.readAll();
		const dst = arr.filter((it) => !test(it));
		await this.writeAll(dst);
	}

	async query(test: (data: T) => boolean, options?: QueryOption): Promise<T[]> {
		const arr = await this.readAll();
		let result = arr.filter((it) => test(it));
		options = options ?? {};
		const sortMode = options.sortMode ?? SortMode.down;
		if (options.sortField) {
			result = result.sort((a: any, b: any) => {
				const isUp = sortMode === SortMode.up;
				let v1 = a[options!.sortField!];
				let v2 = b[options!.sortField!];
				if (v2 === undefined || v2 === null) return isUp ? -1 : 1;
				if (v1 === undefined || v1 === null) return isUp ? 1 : -1;
				v1 = v1.toString();
				v2 = v2.toString();
				return isUp ? v1.localeCompare(v2) : v2.localeCompare(v1);
			});
		}
		if (options.offset) result = result.slice(options.offset);
		if (options.limit) result = result.slice(0, options.limit);
		return result;
	}
}
