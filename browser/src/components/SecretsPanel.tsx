import { Key, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useWebContainer } from "react-webcontainers";

const STORAGE_KEY = "webcontainer_env_vars";

interface SecretsPanelProps {
  isInitialized: boolean;
}

interface EnvVars {
  [key: string]: string;
}

export function SecretsPanel({ isInitialized }: SecretsPanelProps) {
  const webcontainer = useWebContainer();
  const [envVars, setEnvVars] = useState<EnvVars>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load env vars from localStorage and write to WebContainer on mount
  useEffect(() => {
    if (!webcontainer || !isInitialized) return;

    const loadEnvVars = async () => {
      setIsLoading(true);
      try {
        // Load from localStorage
        const storedVars = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "{}"
        );
        setEnvVars(storedVars);

        // Write to .env file
        const envContent = Object.entries(storedVars)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n");

        await webcontainer.fs.writeFile(".env", envContent);
      } catch (error) {
        console.error("Error loading environment variables:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEnvVars();
  }, [webcontainer, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webcontainer || !newKey.trim() || !newValue.trim()) return;

    setIsLoading(true);
    try {
      // Update state
      const updatedVars = {
        ...envVars,
        [newKey]: newValue,
      };
      setEnvVars(updatedVars);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVars));

      // Write to .env file
      const envContent = Object.entries(updatedVars)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
      await webcontainer.fs.writeFile(".env", envContent);

      // Clear form
      setNewKey("");
      setNewValue("");
    } catch (error) {
      console.error("Error updating environment variables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (keyToDelete: string) => {
    if (!webcontainer) return;

    setIsLoading(true);
    try {
      // Update state
      const updatedVars = { ...envVars };
      delete updatedVars[keyToDelete];
      setEnvVars(updatedVars);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVars));

      // Write to .env file
      const envContent = Object.entries(updatedVars)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
      await webcontainer.fs.writeFile(".env", envContent);
    } catch (error) {
      console.error("Error deleting environment variable:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="controls-panel flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-slate-200">Secrets</h2>

        {/* Add new env var form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/50 rounded-md p-3 flex flex-col gap-3 border border-slate-700/50"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-400" />
            <span className="font-medium">Add Variable</span>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Name"
              className="bg-slate-900/50 border border-slate-700/50 rounded-md px-2 py-1.5"
              disabled={isLoading}
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value"
              className="bg-slate-900/50 border border-slate-700/50 rounded-md px-2 py-1.5"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !newKey.trim() || !newValue.trim()}
            className="w-full bg-blue-600/90 hover:bg-blue-500/90 text-white font-medium py-2 px-4 rounded-md shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700/50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Add Variable"
            )}
          </button>
        </form>

        {/* Current env vars */}
        <div className="bg-slate-800/50 rounded-md p-3 flex flex-col gap-2 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-green-400" />
            <span className="font-medium">Environment Variables</span>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-300">{key}=</span>
                <span className="text-slate-400 flex-1">{value}</span>
                <button
                  onClick={() => handleDelete(key)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  ×
                </button>
              </div>
            ))}
            {Object.keys(envVars).length === 0 && (
              <span className="text-sm text-slate-500">No variables set</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
