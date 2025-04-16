import consola from "consola";
import path from "path";

/**
 * Calculates a compact, relative path from a base directory to a target path.
 *
 * @param {string} cwd - The current working directory (base path). Must be an absolute path.
 * @param {string} targetPath - The target path.  Must be an absolute path.
 * @returns {string} A compact, relative path from cwd to targetPath, or the targetPath if an error occurs.
 */
export function getCompactRelativePath(
	cwd: string,
	targetPath: string,
): string {
	try {
		// Validate input
		if (!path.isAbsolute(cwd)) {
			consola.warn("cwd must be an absolute path. [internal warning]");
			return targetPath; // Return original path on error
		}
		if (!path.isAbsolute(targetPath)) {
			consola.warn("targetPath must be an absolute path. [internal warning]");
			return targetPath; // Return original path on error
		}

		// Normalize paths (important for consistent results)
		const normalizedCwd = path.normalize(cwd);
		const normalizedTargetPath = path.normalize(targetPath);

		const relativePath = path.relative(normalizedCwd, normalizedTargetPath);

		// Ensure it starts with './' if it's not an absolute path.  This makes it more compact in many cases.
		if (!relativePath.startsWith("../") && !path.isAbsolute(relativePath)) {
			return `./${relativePath}`;
		}

		return relativePath;
	} catch (error) {
		consola.error("Error calculating compact relative path:", error);
		return targetPath; // Return the original path as a fallback.  Important for robustness.
	}
}
