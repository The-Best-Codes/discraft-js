/* eslint-disable @typescript-eslint/no-explicit-any */
import consola from "consola";
import fs from "fs-extra";
import kleur from "kleur";
import path from "path";
import { fileURLToPath } from "url";
import { runSubprocess } from "../../utils";
import { getCompactRelativePath } from "../../utils/relativePath";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExecBrowserOptions {
	targetDir?: string;
}

const browserFiles = [
	"README.md",
	"index.html",
	"package.json",
	"src/",
	"src/App.tsx",
	"src/Providers.tsx",
	"src/components/",
	"src/components/ControlPanel.tsx",
	"src/components/MonitoringPanel.tsx",
	"src/components/SecretsPanel.tsx",
	"src/components/Terminal.tsx",
	"src/files.ts",
	"src/index.css",
	"src/main.tsx",
	"src/vite-env.d.ts",
	"tsconfig.app.json",
	"tsconfig.json",
	"tsconfig.node.json",
	"vercel.json",
	"vite.config.ts",
];

async function buildBrowser(options: ExecBrowserOptions = {}) {
	const currentWorkingDirectory = process.cwd();
	const targetDir = options.targetDir || "dist";
	const distPath = path.join(currentWorkingDirectory, targetDir);
	const browserPath = path.join(distPath, "browser");
	const packageRoot = path.join(__dirname, "..", "..");
	const browserTemplatePath = path.join(packageRoot, "browser");
	const uxBrowserPath = getCompactRelativePath(
		currentWorkingDirectory,
		browserPath,
	);

	consola.info(`Building browser interface in ${kleur.cyan(uxBrowserPath)}...`);

	// Validate dist package.json and index.js
	const distPackageJsonPath = path.join(distPath, "package.json");
	const distIndexJsPath = path.join(distPath, "index.js");

	try {
		await fs.access(distPackageJsonPath);
		await fs.access(distIndexJsPath);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (error) {
		consola.error(
			`Missing required files in ${kleur.cyan(distPath)}. Run ${kleur.cyan(
				"npm run build",
			)} and make sure ${kleur.cyan("package.json")} and ${kleur.cyan(
				"index.js",
			)} exist.`,
		);
		process.exit(1);
	}

	consola.verbose("Validated dist directory.");

	// Create browser directory
	try {
		await fs.ensureDir(browserPath);
		consola.verbose(`Created browser directory: ${browserPath}`);
	} catch (error: any) {
		consola.error(`Failed to create browser directory: ${error.message}`);
		process.exit(1);
	}

	// Copy browser files
	try {
		for (const file of browserFiles) {
			const sourcePath = path.join(browserTemplatePath, file);
			const destPath = path.join(browserPath, file);

			if (file.endsWith("/")) {
				// Directory
				await fs.copy(sourcePath, destPath);
				consola.verbose(`Copied directory: ${file}`);
			} else {
				// File
				await fs.copy(sourcePath, destPath);
				consola.verbose(`Copied file: ${file}`);
			}
		}

		//Copy and rename gitignore
		await fs.copy(
			path.join(browserTemplatePath, "gitignore.template"),
			path.join(browserPath, ".gitignore"),
		);
		consola.verbose("Copied and renamed gitignore.template to .gitignore");
	} catch (error: any) {
		consola.error(`Failed to copy browser files: ${error.message}`);
		consola.verbose(error);
		process.exit(1);
	}

	// Install dependencies
	try {
		consola.info("Installing dependencies in browser directory...");
		await runSubprocess("npm", ["install", "--legacy-peer-deps"], {
			cwd: browserPath,
		});
		consola.verbose(
			"Dependencies installed successfully in browser directory.",
		);
	} catch (error: any) {
		consola.error(
			`Failed to install dependencies in browser directory: ${error.message}`,
		);
		consola.verbose(error);
		process.exit(1);
	}

	// Update src/files.ts
	try {
		consola.info("Updating files...");
		const files: { [key: string]: { file: { contents: string } } } = {};
		const distFiles = await fs.readdir(distPath);

		for (const filename of distFiles) {
			if (filename === "browser") continue; // Skip the browser directory itself.
			const filePath = path.join(distPath, filename);
			const stats = await fs.stat(filePath);

			if (stats.isFile()) {
				try {
					const contents = await fs.readFile(filePath, "utf-8");
					files[filename] = { file: { contents } };
					consola.verbose(`Added file ${filename} to src/files.ts`);
				} catch (readError: any) {
					consola.warn(`Could not read file ${filename}: ${readError.message}`);
				}
			}
		}

		// Ensure .env is ALWAYS present
		files[".env"] = { file: { contents: "" } };

		const filesTsContent = `export const initialFiles = ${JSON.stringify(
			files,
			null,
			2,
		)};`;
		const filesTsPath = path.join(browserPath, "src", "files.ts");
		await fs.writeFile(filesTsPath, filesTsContent);
		consola.verbose("src/files.ts updated successfully.");
	} catch (error: any) {
		consola.error(`Failed to update src/files.ts: ${error.message}`);
		consola.verbose(error);
		process.exit(1);
	}

	// Build browser app
	try {
		consola.info("Building browser application...");
		await runSubprocess("npm", ["run", "build"], { cwd: browserPath });
		consola.info("Built successfully.");
	} catch (error: any) {
		consola.error(`Failed to build browser application: ${error.message}`);
		consola.verbose(error);
		process.exit(1);
	}

	consola.success(
		`Browser interface built successfully in ${kleur.cyan(uxBrowserPath)}.`,
	);
	consola.info(
		`Run ${kleur.cyan(
			"discraft browser serve",
		)} to serve the browser interface files.`,
	);
}

export { buildBrowser };
