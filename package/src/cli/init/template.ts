import consola from "consola";
import fs from "fs-extra";
import path from "path";
import type { TemplateConfig } from "./config";

async function copyTemplateFiles(
	templatePath: string,
	projectPath: string,
	config: TemplateConfig,
) {
	const { files } = config;

	for (const file of files) {
		const sourcePath = path.join(templatePath, file);
		const destPath = path.join(projectPath, file);

		try {
			if (fs.existsSync(sourcePath)) {
				if (fs.lstatSync(sourcePath).isDirectory()) {
					await fs.copy(sourcePath, destPath);
				} else {
					await fs.copyFile(sourcePath, destPath);
				}
			} else {
				consola.warn(`Skipping file/dir that doesn't exist: ${file}`);
			}
		} catch (e) {
			consola.error(`Failed to copy ${sourcePath} to ${destPath}`, e);
			throw new Error(`Failed to copy template files: ${e}`);
		}
	}

	// Handle .gitignore specially
	const gitignoreSourcePath = path.join(templatePath, "gitignore.template");
	const gitignoreDestPath = path.join(projectPath, ".gitignore");

	try {
		await fs.copyFile(gitignoreSourcePath, gitignoreDestPath);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		if (e.code !== "ENOENT") {
			consola.error(
				`Failed to copy ${gitignoreSourcePath} to ${gitignoreDestPath}`,
				e,
			);
			throw new Error(`Failed to copy .gitignore template file, ${e}`);
		}
	}
}

export { copyTemplateFiles };
