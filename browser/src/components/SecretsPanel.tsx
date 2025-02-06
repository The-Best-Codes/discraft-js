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

const Button = ({
  variant = "ghost",
  size = "icon",
  className = "",
  children,
  ...props
}: any) => {
  let baseClass = "rounded-md";
  let variantClass = "";
  let sizeClass = "";

  if (variant === "ghost") {
    variantClass = "hover:bg-slate-700/20";
  } else if (variant === "outline") {
    variantClass =
      "border border-slate-700 hover:bg-slate-700/20 text-slate-300";
  }

  if (size === "icon") {
    sizeClass = "h-6 w-6 p-1";
  } else if (size === "sm") {
    sizeClass = "py-1.5 px-2 text-sm";
  }

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }: any) => {
  return (
    <input
      className={`bg-slate-900/50 border border-slate-700/50 rounded-md px-2 py-1.5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:bg-slate-700/50 disabled:border-none ${className}`}
      {...props}
    />
  );
};

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
          .map(([key, value]) => `"${key}"="${value}"`)
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
    <div className="animate-pulse flex flex-row gap-2 p-2">
      <div className="bg-gray-700 h-6 w-1/3 rounded-md" />
      <div className="bg-gray-700 h-6 w-2/3 rounded-md" />
      <div className="flex items-center justify-end gap-2">
        <div className="bg-gray-700 h-6 w-6 rounded-md" />
        <div className="bg-gray-700 h-6 w-6 rounded-md" />
        <div className="bg-gray-700 h-6 w-6 rounded-md" />
      </div>
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

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/50 rounded-md p-3 flex flex-col gap-3 border border-slate-700/50 mt-4"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-400" />
            <span className="font-medium text-slate-200">Add New Variable</span>
          </div>

          <div className="flex flex-col gap-2">
            <Input
              type="text"
              value={newKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewKey(e.target.value)
              }
              placeholder="Name"
              disabled={isLoading}
            />
            <Input
              type="text"
              value={newValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewValue(e.target.value)
              }
              placeholder="Value"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={
              isLoading || !newKey.trim() || !newValue.trim() || !isInitialized
            }
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
        <div className="bg-slate-800/50 rounded-md overflow-hidden border border-slate-700/50">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-green-400" />
              <span className="font-medium text-slate-200">
                Environment Variables
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-0 mt-0">
            {!isInitialized && Object.keys(envVars).length === 0 ? (
              <LoadingSkeleton />
            ) : (
              <div className="flex flex-col gap-0">
                {Object.entries(envVars).map(([key, value]) => {
                  const isEditing = editingKey === key;
                  const isLoading = loadingKeys.has(key);
                  const isHidden = hiddenValues.has(key);

                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-2 border-t border-slate-700`}
                    >
                      <div className="flex items-center space-x-2 flex-grow mr-2 overflow-hidden">
                        <span className="font-medium text-base whitespace-nowrap text-slate-300">
                          {key}:
                        </span>
                        <div className="flex-grow min-w-0">
                          <Input
                            type={isHidden ? "password" : "text"}
                            value={isEditing ? editedValue : value}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>,
                            ) => isEditing && setEditedValue(e.target.value)}
                            readOnly={!isEditing}
                            className="h-8 w-full text-base py-0 px-1 bg-slate-900/50 border border-slate-700 text-slate-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:text-slate-300"
                          onClick={() => toggleValueVisibility(key)}
                          aria-label={isHidden ? "Show value" : "Hide value"}
                        >
                          {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                        {isEditing ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-400 hover:text-green-300"
                            onClick={() => handleSave(key)}
                            disabled={isLoading}
                            aria-label="Save"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-400 hover:text-blue-300"
                            onClick={() => startEditing(key, value)}
                            disabled={isLoading}
                            aria-label="Edit"
                          >
                            <Edit2 size={14} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(key)}
                          disabled={isLoading}
                          aria-label="Delete"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!isLoading &&
              isInitialized &&
              Object.keys(envVars).length === 0 && (
                <span className="text-base text-slate-500 p-3">
                  No variables set
                </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
