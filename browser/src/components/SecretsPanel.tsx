import {
  Edit2,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
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
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState("");
  const [hiddenValues, setHiddenValues] = useState<Set<string>>(new Set());

  // Load env vars from localStorage and write to WebContainer on mount
  useEffect(() => {
    if (!webcontainer || !isInitialized) return;

    const loadEnvVars = async () => {
      setIsLoading(true);
      try {
        // Load from localStorage
        const storedVars = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || "{}",
        );
        setEnvVars(storedVars);

        // Hide all values by default
        setHiddenValues(new Set(Object.keys(storedVars)));

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

  // Function to create loading skeleton rows
  const LoadingSkeleton = () => (
    <div className="animate-pulse flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-2 text-sm bg-slate-900/30 p-2 rounded-md"
        >
          <div className="bg-slate-700/50 h-6 w-32 rounded" />
          <div className="text-slate-400">=</div>
          <div className="bg-slate-700/50 h-6 flex-1 rounded" />
          <div className="flex items-center gap-1 ml-auto">
            <div className="bg-slate-700/50 h-7 w-7 rounded-md" />
            <div className="bg-slate-700/50 h-7 w-7 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webcontainer || !newKey.trim() || !newValue.trim()) return;

    setIsLoading(true);
    // Hide the value by default for new variables
    setHiddenValues((prev) => new Set([...prev, newKey]));
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

    // Add to loading set
    setLoadingKeys((prev) => new Set([...prev, keyToDelete]));
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
      // Remove from loading set
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(keyToDelete);
        return next;
      });
    }
  };

  const toggleValueVisibility = (key: string) => {
    setHiddenValues((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const startEditing = (key: string, value: string) => {
    setEditingKey(key);
    setEditedValue(value);
  };

  const handleSave = async (key: string) => {
    if (!webcontainer || !editedValue.trim()) return;

    setLoadingKeys((prev) => new Set([...prev, key]));
    try {
      const updatedVars = {
        ...envVars,
        [key]: editedValue,
      };
      setEnvVars(updatedVars);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVars));

      const envContent = Object.entries(updatedVars)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
      await webcontainer.fs.writeFile(".env", envContent);

      setEditingKey(null);
      setEditedValue("");
    } catch (error) {
      console.error("Error updating environment variable:", error);
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <div className="controls-panel flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-slate-200">Secrets</h2>

        {!isInitialized ? (
          <div className="bg-slate-800/50 rounded-md p-3 flex items-center gap-2 border border-slate-700/50">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <span className="text-slate-400">Container is starting...</span>
          </div>
        ) : (
          <>
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

              <div className="flex flex-col gap-3 mt-2">
                {isLoading && Object.keys(envVars).length === 0 ? (
                  <LoadingSkeleton />
                ) : (
                  Object.entries(envVars).map(([key, value]) => {
                    const isEditing = editingKey === key;
                    const isLoading = loadingKeys.has(key);
                    const isHidden = hiddenValues.has(key);

                    return (
                      <div
                        key={key}
                        className="flex flex-wrap items-center gap-2 text-sm bg-slate-900/30 p-2 rounded-md group relative"
                      >
                        <input
                          type="text"
                          value={key}
                          disabled={true}
                          className="font-medium text-slate-300 bg-transparent border-none outline-none min-w-[100px] flex-shrink-0"
                        />
                        <span className="text-slate-400">=</span>
                        <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                          <input
                            type={isHidden ? "password" : "text"}
                            value={isEditing ? editedValue : value}
                            onChange={(e) =>
                              isEditing && setEditedValue(e.target.value)
                            }
                            disabled={!isEditing}
                            className="flex-1 text-slate-300 bg-transparent disabled:border-transparent border border-slate-700 rounded px-2 py-1 disabled:cursor-default"
                          />
                          <button
                            type="button"
                            onClick={() => toggleValueVisibility(key)}
                            className="text-slate-500 hover:text-slate-300 p-1 rounded-md"
                            title={isHidden ? "Show value" : "Hide value"}
                          >
                            {isHidden ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1 ml-auto">
                          {isEditing ? (
                            <button
                              onClick={() => handleSave(key)}
                              disabled={isLoading}
                              className="p-1.5 hover:bg-green-500/20 rounded-md text-green-400"
                              title="Save"
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditing(key, value)}
                              disabled={isLoading}
                              className="p-1.5 hover:bg-blue-500/20 rounded-md text-blue-400"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(key)}
                            disabled={isLoading}
                            className="p-1.5 hover:bg-red-500/20 rounded-md text-red-400"
                            title="Delete"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                {!isLoading && Object.keys(envVars).length === 0 && (
                  <span className="text-sm text-slate-500">
                    No variables set
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
