import * as fsMod from "https://deno.land/std@0.213.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.213.0/path/mod.ts";
import { uuid } from "https://deno.land/x/uuid@v0.1.2/mod.ts";
import * as mrmime from "https://deno.land/x/mrmime@v2.0.0/mod.ts";
import { moment } from "https://deno.land/x/deno_ts_moment@0.0.4/mod.ts";

export enum FilePermission {
	public,
	personal,
}

export interface FileModel {
	id: string;
	name: string;
	suffixName: string;
	fullName: string;
	size: number;
	mime: string;
	createTime: string;
	updateTime: string;
	permission: FilePermission;
	description: string;
}

export function parseFileName(fullName: string): { name: string; suffixName: string } {
	const i = fullName.lastIndexOf(".");
	if (i < 0 || fullName.length === 1) return { name: fullName, suffixName: "" };
	if (i === 0) return { name: "", suffixName: fullName.substring(1) };
	if (i === fullName.length - 1) return { name: fullName.substring(0, i), suffixName: "" };
	return { name: fullName.substring(0, i), suffixName: fullName.substring(i + 1) };
}

export class FileManager {
	constructor(folder: string) {
		this.folder = folder;
		this.initRootFolder();
	}

	private folder = "";

	private initRootFolder() {
		const folderExists = fsMod.existsSync(this.folder);
		if (!folderExists) {
			Deno.mkdirSync(this.folder, { recursive: true });
			return;
		}
		const stat = Deno.statSync(this.folder);
		if (stat.isFile) {
			Deno.removeSync(this.folder);
			Deno.mkdirSync(this.folder, { recursive: true });
		}
	}

	async isFileExists(fileId: string): Promise<boolean> {
		const folderPath = path.join(this.folder, fileId);
		return await fsMod.exists(folderPath);
	}

	private async writeFile(filePath: string, readable: ReadableStream<Uint8Array>): Promise<number> {
		try {
			const file = await Deno.create(filePath);
			const reader = readable.getReader();
			let size = 0;
			while (true) {
				const buf = await reader.read();
				if (buf.value) {
					const count = await file.write(buf.value);
					size += count;
				}
				if (buf.done) break;
			}
			file.close();
			return size;
		} catch (e) {
			console.error(e);
			return 0;
		}
	}

	private async writeString(filePath: string, content: string) {
		try {
			const textEncoder = new TextEncoder();
			const buf = textEncoder.encode(content);
			const file = await Deno.create(filePath);
			await file.write(buf);
			file.close();
			return;
		} catch (e) {
			console.error(e);
		}
	}

	getFilePath(fileId: string) {
		return path.join(this.folder, fileId, "file");
	}

	getFileInfoPath(fileId: string) {
		return path.join(this.folder, fileId, "info");
	}

	// 保存文件
	async saveFile(
		content: ReadableStream<Uint8Array>,
		options: { fileName: string; description?: string; permission?: FilePermission }
	): Promise<FileModel | null> {
		const id = uuid();
		const folderPath = path.join(this.folder, id);
		if (await this.isFileExists(id)) {
			await Deno.remove(folderPath, { recursive: true });
		}
		await Deno.mkdir(folderPath, { recursive: true });
		const filePath = this.getFilePath(id);
		const infoPath = this.getFileInfoPath(id);
		const fullName = path.basename(options.fileName);
		const { name, suffixName } = parseFileName(fullName);
		const mime = mrmime.lookup(options.fileName) || "application/octet-stream";
		const size = await this.writeFile(filePath, content);
		if (!size) return null;
		const updateTime = moment().format("YYYY-MM-DD HH:mm:ss");
		const createTime = updateTime;
		const description = options.description ?? "";
		const permission = options.permission ?? FilePermission.public;
		const model: FileModel = { id, name, suffixName, fullName, size, mime, createTime, updateTime, description, permission };
		await this.writeString(infoPath, JSON.stringify(model));
		return model;
	}

	// 更新文件
	async updateFile(
		content: ReadableStream<Uint8Array>,
		options: { id: string; fileName?: string; description?: string; permission?: FilePermission }
	): Promise<FileModel | null> {
		const id = options.id;
		const existsFile = await this.getFile(id);
		if (!existsFile) return null;
		const filePath = this.getFilePath(id);
		const infoPath = this.getFileInfoPath(id);
		const fullName = options.fileName ? path.basename(options.fileName) : existsFile.file.fullName;
		const { name, suffixName } = parseFileName(fullName);
		const mime = mrmime.lookup(fullName) || "application/octet-stream";
		const size = await this.writeFile(filePath, content);
		if (!size) return null;
		const updateTime = moment().format("YYYY-MM-DD HH:mm:ss");
		const createTime = existsFile.file.createTime;
		const description = options.description ?? existsFile.file.description;
		const permission = options.permission ?? existsFile.file.permission;
		const model: FileModel = { id, name, suffixName, fullName, size, mime, createTime, updateTime, description, permission };
		await this.writeString(infoPath, JSON.stringify(model));
		return model;
	}

	// 保存指定路径的文件
	async saveFileByPath(filePath: string): Promise<FileModel | null> {
		const folderExists = await fsMod.exists(filePath);
		if (!folderExists) return null;
		const stat = await Deno.stat(filePath);
		if (!stat.isFile) return null;
		const file = await Deno.open(filePath);
		const model = await this.saveFile(file.readable, { fileName: path.basename(filePath) });
		return model;
	}

	// 根据文件 Id 获取文件信息
	async getFile(fileId: string): Promise<{ file: FileModel; path: string } | null> {
		const filePath = this.getFilePath(fileId);
		const infoPath = this.getFileInfoPath(fileId);
		const fileExists = await fsMod.exists(filePath);
		const infoExists = await fsMod.exists(infoPath);
		if (!fileExists || !infoExists) return null;
		try {
			const infoStr = await Deno.readTextFile(infoPath);
			if (!infoStr) return null;
			const info = JSON.parse(infoStr);
			return { file: info, path: filePath };
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	// 根据文件 Id 删除文件
	async deleteFile(fileId: string) {
		if (!(await this.isFileExists(fileId))) return;
		const filePath = path.join(this.folder, fileId);
		await Deno.remove(filePath, { recursive: true });
	}
}
