import { useEffect, useState } from "react";
import { ActorSubclass } from "@dfinity/agent";
import { _SERVICE } from "../../../declarations/backend/backend.did"; // Import the backend service type
import { useBackend } from "../ic/Actors"; // Custom hook to get the backend actor
import { useInternetIdentity } from "ic-use-internet-identity"; // Importing the useInternetIdentity hook

type Entry = {
  url: string;
  clickCount: bigint;
  lastClicked: string | null; // Add lastClicked to the Entry type
  time: string; // Add time to the Entry type for initial insertion timestamp
};

export function Entry() {
  const { actor: backend } = useBackend() as { actor: ActorSubclass<_SERVICE> };
  const { identity } = useInternetIdentity(); // Getting the identity from Internet Identity
  const [url, setURL] = useState<string>(""); // Single input field for URL
  const [entries, setEntries] = useState<Entry[]>([]); // State to hold all entries
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for the Save button
  const [loadingDeletes, setLoadingDeletes] = useState<string[]>([]); // URLs currently being deleted
  const [isAscending, setIsAscending] = useState<boolean>(true); // State to track alphabetical sort order
  const [isCountAscending, setIsCountAscending] = useState<boolean>(false); // State to track click count sort order
  const [isLastVisitAscending, setIsLastVisitAscending] = useState<boolean>(true); // State to track last visit sort order

  const [isEditMode, setIsEditMode] = useState<boolean>(false); // State to track display mode (original or formatted)
  const [editedEntries, setEditedEntries] = useState<{ [index: number]: string }>({}); // Track edits for each entry

  // Fetch all entries when the component mounts
  useEffect(() => {
    async function fetchEntries() {
      if (backend && identity) {
        const allEntries = await backend.getAllEntries();
        const sortedEntries = allEntries
          .map((entry) => ({
            url: entry[0],
            clickCount: BigInt(entry[1].clickCount),
            lastClicked: entry[1].lastClicked[0] ?? null, // Optional lastClicked timestamp
            time: entry[1].time, // Initial insertion timestamp
          }))
          .sort((a, b) => {
            // Sort by the `time` field in descending order (newest first)
            const timeA = parseInt(a.time, 10);
            const timeB = parseInt(b.time, 10);
            return timeB - timeA; // Descending order
          });

        setEntries(sortedEntries);
      }
    }
    fetchEntries();
  }, [backend, identity]);

  // Function to insert a new entry
  async function handleInsert() {
    if (!backend || !identity) return;

    // Prevent saving more than 200 URLs
    if (entries.length >= 200) {
      alert("You can only save up to 200 URLs.");
      return;
    }

    // Prevent empty entries
    if (!url.trim()) {
      alert("Please enter a URL.");
      return;
    }

    // Check for URL length
    if (url.length > 2083) {
      alert(`The URL is too long. Maximum length is 2083 characters.`);
      return;
    }

    // Automatically prepend "https://" if URL does not start with "http://" or "https://"
    const formattedUrl = /^(http:\/\/|https:\/\/)/.test(url) ? url : `https://${url}`;

    // Check for duplicate URLs in entries
    const isDuplicate = entries.some((entry) => entry.url === formattedUrl);
    if (isDuplicate) {
      alert("This URL is already added.");
      return;
    }

    setIsLoading(true); // Start loading

    try {
      await backend.insert(formattedUrl);

      // Add the new entry at the beginning of the entries list
      setEntries([
        { url: formattedUrl, clickCount: BigInt(0), lastClicked: null, time: Math.floor(Date.now() / 1000).toString() },
        ...entries,
      ]);
      setURL(""); // Reset the input field
    } catch (error) {
      console.error("Error inserting entry:", error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }

  // Function to delete an entry
  async function handleDelete(url: string) {
    if (!backend || !identity) return;

    // Add the URL to the loading state
    setLoadingDeletes((prev) => [...prev, url]);

    try {
      await backend.deleteEntry(url); // Call backend to delete the entry
      setEntries(entries.filter((entry) => entry.url !== url)); // Remove the deleted entry from the list
    } catch (error) {
      console.error("Error deleting entry:", error);
    } finally {
      // Remove the URL from the loading state
      setLoadingDeletes((prev) => prev.filter((loadingUrl) => loadingUrl !== url));
    }
  }

  // Function to increment click count when URL is clicked
  const handleClickCountIncrement = async (url: string) => {
    if (!backend || !identity) return;
    await backend.incrementClickCount(url);

    // Set lastClicked to the current Unix timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000).toString(); // Get the current Unix timestamp (in seconds)
    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.url === url ? { ...entry, clickCount: entry.clickCount + BigInt(1), lastClicked: timestamp } : entry
      )
    );
  };

  // Function to format display URL by removing "https://", "http://", "www.", and trailing slashes only for display
  const formatUrl = (url: string) => {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  };

  // Calculate elapsed time and format it as seconds, minutes, hours, or days
  const formatElapsedTime = (lastClicked: string | null) => {
    if (!lastClicked) return "";
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
    const lastClickedTimestamp = parseInt(lastClicked, 10); // Convert lastClicked to an integer
    const elapsedSeconds = currentTimestamp - lastClickedTimestamp; // Calculate the difference in seconds

    if (elapsedSeconds >= 86400) {
      // 86400 seconds = 1 day
      const elapsedDays = Math.floor(elapsedSeconds / 86400);
      return `${elapsedDays}d`; // Display in days if 1 day or more
    } else if (elapsedSeconds >= 3600) {
      // 3600 seconds = 1 hour
      const elapsedHours = Math.floor(elapsedSeconds / 3600);
      return `${elapsedHours}h`; // Display in hours if 1 hour or more
    } else if (elapsedSeconds >= 60) {
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      return `${elapsedMinutes}m`; // Display in minutes if 60 seconds or more
    }

    return `${elapsedSeconds}s`; // Display in seconds if less than 60 seconds
  };

  // Function to sort entries alphabetically based on the formatted URL (without http, www, etc.)
  const handleSortAlphabetically = () => {
    const sortedEntries = [...entries].sort((b, a) => {
      const formattedA = formatUrl(a.url);
      const formattedB = formatUrl(b.url);
      return isAscending ? formattedA.localeCompare(formattedB) : formattedB.localeCompare(formattedA);
    });
    setEntries(sortedEntries);
    setIsAscending(!isAscending); // Toggle alphabetical sort order for next click
  };

  // Function to sort entries by click count
  const handleSortByClickCount = () => {
    const sortedEntries = [...entries].sort((a, b) =>
      isCountAscending ? Number(a.clickCount - b.clickCount) : Number(b.clickCount - a.clickCount)
    );
    setEntries(sortedEntries);
    setIsCountAscending(!isCountAscending); // Toggle click count sort order for next click
  };

  // Function to sort entries by last visit time
  const handleSortByLastVisit = () => {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Get current Unix timestamp in seconds
    const sortedEntries = [...entries].sort((a, b) => {
      // Prioritize entries with no lastClicked (no clicks) to be at the bottom
      if (a.lastClicked === null && b.lastClicked !== null) return 1;
      if (a.lastClicked !== null && b.lastClicked === null) return -1;
      if (a.lastClicked === null && b.lastClicked === null) return 0;

      // Safely parse the timestamps if they exist
      const elapsedA = currentTimestamp - parseInt(a.lastClicked || "0", 10);
      const elapsedB = currentTimestamp - parseInt(b.lastClicked || "0", 10);
      return isLastVisitAscending ? elapsedA - elapsedB : elapsedB - elapsedA;
    });

    setEntries(sortedEntries);
    setIsLastVisitAscending(!isLastVisitAscending); // Toggle last visit sort order for next click
  };

  // Toggle between displaying original URLs and formatted URLs, saving any unsaved edits
  const handleToggleEdit = () => {
    saveAllEdits(); // Save edits before toggling
    setIsEditMode(!isEditMode);
  };

  // Handle URL edit change for a specific entry
  const handleEditChange = (index: number, value: string) => {
    setEditedEntries((prev) => ({ ...prev, [index]: value }));
  };

  // Save the edited URL when focus is lost or mode is toggled
  const handleBlurSave = (index: number) => {
    const updatedUrl = editedEntries[index];
    if (updatedUrl) {
      setEntries((prevEntries) =>
        prevEntries.map((entry, i) =>
          i === index
            ? { url: updatedUrl, clickCount: entry.clickCount, lastClicked: entry.lastClicked, time: entry.time }
            : entry
        )
      );
      setEditedEntries((prev) => {
        const newEdits = { ...prev };
        delete newEdits[index];
        return newEdits;
      });
    }
  };

  // Random shuffle entires
  const handleShuffle = () => {
    const shuffledEntries = [...entries];
    for (let i = shuffledEntries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledEntries[i], shuffledEntries[j]] = [shuffledEntries[j], shuffledEntries[i]];
    }
    setEntries(shuffledEntries);
  };

  // Save all edits for each entry
  const saveAllEdits = () => {
    setEntries((prevEntries) =>
      prevEntries.map((entry, index) => ({
        url: editedEntries[index] || entry.url,
        clickCount: entry.clickCount,
        lastClicked: entry.lastClicked,
        time: entry.time,
      }))
    );
    setEditedEntries({});
  };

  if (!identity) {
    return <div>Please log in using your Internet Identity</div>; // Show a message if no identity is found
  }

  return (
    <div className="entry-container" style={{ maxWidth: "100vw", width: "min(100%, 200vw)", margin: "0 auto" }}>
      <div className="flex items-center max-w-screen-sm w-full gap-1 mt-2 mb-6">
        <input
          type="text"
          placeholder="https://..."
          value={url}
          onChange={(e) => setURL(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleInsert();
            }
          }}
          maxLength={2083}
          className="flex-grow bg-slate-50 border border-gray-300 rounded-md p-2 h-8 mr-2  min-w-0" // Input fields extended with flex-grow, margin to the right
        />

        <button
          onClick={handleInsert}
          className="bg-green-500 text-white rounded shadow-md h-8 w-16 min-w-12 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          disabled={isLoading}
        >
          Save
        </button>
      </div>

      <div>
        <button onClick={handleSortByClickCount} className="m-1.5 ml-0">
          Clicks{isCountAscending ? "↓" : "↑"} {/* Display clicks ↑ or ↓ based on click clicks sort order */}
        </button>
        <button onClick={handleSortByLastVisit} className="m-1.5">
          Last Visit{isLastVisitAscending ? "↑" : "↓"} {/* Display Last Visit ↑ or ↓ based on last visit sort order */}
        </button>
        <button onClick={handleSortAlphabetically} className="m-1.5">
          {isAscending ? "ABC" : "CBA"} {/* Display ABC or CBA based on alphabetical sort order */}
        </button>
        <button onClick={handleShuffle} className="m-1.5">
          🔀
        </button>
        <button onClick={handleToggleEdit} className="m-1.5">
          {isEditMode ? "Save" : "Edit"}
        </button>
        <ul className="list-none p-0 m-0 max-w-screen-sm w-full	">
          {entries.map((entry, index) => (
            <li key={index} className="flex items-center mb-0.5 mt-2 break-words">
              {isEditMode && (
                <button
                  onClick={() => handleDelete(entry.url)}
                  className="mr-0.5 shrink-0 flex items-center justify-center h-5 w-5"
                  disabled={loadingDeletes.includes(entry.url)}
                >
                  {loadingDeletes.includes(entry.url) ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-0"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    "🗑️"
                  )}
                </button>
              )}
              {!isEditMode ? (
                <div className="inline-block">
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleClickCountIncrement(entry.url)}
                    className="no-underline text-inherit"
                  >
                    {formatUrl(entry.url)}{" "}
                  </a>
                  <span className="text-sm text-gray-400">
                    {" "}
                    {entry.clickCount.toString()} clicks
                    {formatElapsedTime(entry.lastClicked) && <>, {formatElapsedTime(entry.lastClicked)} ago</>}
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={editedEntries[index] ?? entry.url}
                  onChange={(e) => handleEditChange(index, e.target.value)}
                  onBlur={() => handleBlurSave(index)}
                  className="w-full bg-pink-50 rounded-md ml-1 h-6"
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
