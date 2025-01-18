import { useRef, useEffect, useState } from "react";
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
  const [isEntriesLoading, setIsEntriesLoading] = useState<boolean>(true); // Loading the entry
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for the Save button
  const [loadingDeletes, setLoadingDeletes] = useState<string[]>([]); // URLs currently being deleted
  const [isAscending, setIsAscending] = useState<boolean>(true); // State to track alphabetical sort order
  const [isCountAscending, setIsCountAscending] = useState<boolean>(false); // State to track click count sort order
  const [isLastVisitAscending, setIsLastVisitAscending] = useState<boolean>(true); // State to track last visit sort order
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input field

  const [isEditMode, setIsEditMode] = useState<boolean>(false); // State to track display mode (original or formatted)
  const [editedEntries, setEditedEntries] = useState<{ [index: number]: string }>({}); // Track edits for each entry

  useEffect(() => {
    async function fetchEntries() {
      setIsEntriesLoading(true);
      if (backend && identity) {
        try {
          // Fetch the latest entries from the backend
          const allEntries = await backend.getEntries();
          const sortedEntries = allEntries
            .map((entry) => ({
              url: entry[0],
              clickCount: BigInt(entry[1].clickCount),
              lastClicked: entry[1].lastClicked[0] ?? null, // Handle optional lastClicked
              time: entry[1].time,
            }))
            .sort((a, b) => {
              // Sort entries by time in descending order (newest first)
              const timeA = parseInt(a.time, 10);
              const timeB = parseInt(b.time, 10);
              return timeB - timeA;
            });

          setEntries(sortedEntries); // Update the entries state
        } catch (error) {
          console.error("Error fetching entries:", error);
        } finally {
          setIsEntriesLoading(false);
        }
      } else {
        // Clear entries when no identity is available
        setEntries([]);
        setIsEntriesLoading(false);
      }
    }

    fetchEntries(); // Fetch entries on component mount or when dependencies change
  }, [backend, identity]);

  useEffect(() => {
    // Clear entries explicitly on logout
    if (!identity) {
      // Reset all relevant states on logout
      setEntries([]); // Clear entries
      setEditedEntries({}); // Clear edited entries
      setURL(""); // Reset the input URL
      setIsEditMode(false); // Exit edit mode
      setIsLoading(false); // Reset loading state
      setLoadingDeletes([]); // Clear loading deletes
    }
  }, [identity]);

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
      // Use formattedUrl instead of raw url
      await backend.insert(formattedUrl);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      setEntries([{ url: formattedUrl, clickCount: BigInt(0), lastClicked: null, time: timestamp }, ...entries]);
      setURL("");
    } catch (error) {
      console.error("Error inserting entry:", error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus(); // Focus back to the input field
    }
  }

  // Delete an entry
  async function handleDelete(url: string) {
    if (!backend || !identity) return;

    // Optimistically update the UI by removing the entry from the list immediately
    setEntries((prevEntries) => prevEntries.filter((entry) => entry.url !== url));

    // Add the URL to the loadingDeletes state
    setLoadingDeletes((prev) => [...new Set([...prev, url])]); // Avoid duplicates

    try {
      // Perform the backend deletion
      await backend.deleteEntry(url);
    } catch (error) {
      console.error("Error deleting entry:", error);

      // If deletion fails, re-add the entry back to the list
      const allEntries = await backend.getEntries();
      const updatedEntries = allEntries.map((entry) => ({
        url: entry[0],
        clickCount: BigInt(entry[1].clickCount),
        lastClicked: entry[1].lastClicked[0] ?? null,
        time: entry[1].time,
      }));
      setEntries(updatedEntries);
    } finally {
      // Remove the URL from the loadingDeletes state
      setLoadingDeletes((prev) => prev.filter((u) => u !== url));
    }
  }

  // Increment the click count for a URL
  async function handleClickCountIncrement(url: string) {
    if (!backend || !identity) return;
    try {
      await backend.incrementClickCount(url);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.url === url ? { ...entry, clickCount: entry.clickCount + BigInt(1), lastClicked: timestamp } : entry
        )
      );
    } catch (error) {
      console.error("Error incrementing click count:", error);
    }
  }

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
    if (isEditMode) {
      saveAllEdits(); // Save edits before toggling
    }
    setIsEditMode(!isEditMode);
  };

  // Handle URL edit change for a specific entry
  const handleEditChange = (index: number, value: string) => {
    setEditedEntries((prev) => ({ ...prev, [index]: value }));
  };

  const handleBlurSave = async (index: number) => {
    const updatedUrl = editedEntries[index];
    const originalUrl = entries[index].url; // Get original URL

    if (updatedUrl && updatedUrl !== originalUrl) {
      try {
        // Call updateEntry on the backend
        await backend.updateEntry(originalUrl, updatedUrl);

        // Update front-end status
        setEntries((prevEntries) =>
          prevEntries.map((entry, i) => (i === index ? { ...entry, url: updatedUrl } : entry))
        );

        // Reset edited status
        setEditedEntries((prev) => {
          const newEdits = { ...prev };
          delete newEdits[index];
          return newEdits;
        });
      } catch (error) {
        console.error("Error updating entry:", error);
      }
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
    setEntries((prevEntries) => {
      return prevEntries.map((entry, index) => ({
        url: editedEntries[index] || entry.url,
        clickCount: entry.clickCount,
        lastClicked: entry.lastClicked,
        time: entry.time,
      }));
    });
    setEditedEntries({});
  };

  if (!identity) {
    return <div>Please log in using your Internet Identity</div>; // Show a message if no identity is found
  }

  return (
    <div className="entry-container" style={{ maxWidth: "100vw", width: "min(100%, 200vw)", margin: "0 auto" }}>
      <div className="flex items-center max-w-screen-sm w-full gap-1 mt-2 mb-6">
        <input
          ref={inputRef} // Attach ref to the input field
          type="text"
          placeholder="Type a URL"
          value={url}
          onChange={(e) => setURL(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) {
              handleInsert();
            }
          }}
          maxLength={2083}
          disabled={isLoading} // Disable the input field during loading
          className={`flex-grow p-2 h-8 mr-2 min-w-0 rounded-md border transition-all duration-200 
      ${
        isLoading
          ? "bg-gray-300 cursor-not-allowed border-gray-400" // Apply disabled styles
          : "bg-slate-50 border-gray-300"
      }`}
        />

        <button
          onClick={handleInsert}
          className="bg-green-500 text-white rounded shadow-md h-8 w-16 min-w-12 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          disabled={isLoading} // Disable the button during loading
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
          {isEditMode ? "Edited ✅" : "Edit"}
        </button>
        <ul className="list-none p-0 m-0 max-w-screen-sm w-full">
          {isEntriesLoading ? (
            <li className="flex items-center justify-start mt-2">
              <svg
                className="animate-spin h-6 w-6 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </li>
          ) : entries.length === 0 ? (
            <p className="flex items-center mb-0.5 mt-2">No bookmarks found.</p>
          ) : (
            entries.map((entry, index) => (
              <li key={index} className="flex items-center mb-0.5 mt-2 break-words">
                {isEditMode && (
                  <button
                    onClick={() => handleDelete(entry.url)}
                    className="mr-0.5 shrink-0 flex items-center justify-center h-5 w-5"
                    disabled={loadingDeletes.includes(entry.url)} // Disable button if currently deleting
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
                      className="break-all no-underline text-inherit hover:underline active:underline"
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
                    className="w-full rounded-md ml-1 h-6 bg-transparent decoration-inherit"
                  />
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
