export const initialFiles = {
	".env": {
		file: {
			contents: "",
		},
	},
	"package.json": {
		file: {
			contents: `{\n  \"name\": \"webcontainer-app\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"start\": \"node index.js\",\n    \"build\": \"echo 'Building...'\"\n  }\n}`,
		},
	},
	"index.js": {
		file: {
			contents: `console.error("If you see this message, Discraft did not bundle your application correctly.");`,
		},
	},
};
