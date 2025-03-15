import fs from "fs/promises";
import path from "path";

interface TemplateConfig {
	files: string[];
	postCopy?: {
		instructions?: string[];
		commands?: string[];
		defaultDevelopment?: boolean | string;
		defaultProduction?: boolean | string;
		defaultStart?: boolean | string;
	};
}

async function loadTemplateConfig(
	templatePath: string,
): Promise<TemplateConfig> {
	const configPath = path.join(templatePath, "template.json");

	try {
		await fs.access(configPath, fs.constants.F_OK);
		const configContent = await fs.readFile(configPath, "utf-8");
		return JSON.parse(configContent);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (error) {
		// If config file doesn't exist we use default based on the template name
		return {
			files: [
				"clients",
				"commands",
				"events",
				"utils",
				".env.example",
				"index.ts",
				"package.json",
				"tsconfig.json",
			],
			postCopy: {
				instructions: ["Configure your .env file with your bot token"],
			},
		};
	}
}

export { loadTemplateConfig };
export type { TemplateConfig };
