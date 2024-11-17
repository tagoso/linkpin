import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";

actor {
    type Name = Text;

    type Entry = {
        url : Text;
        time : Text;
        clickCount : Nat; // Track the number of clicks
        lastClicked : ?Text; // Optional field to store the last clicked timestamp
    };

    stable var stableBookmarkEntries : [(Name, Entry)] = [];

    // Initialize the bookmark as a HashMap
    var bookmark = Map.HashMap<Name, Entry>(0, Text.equal, Text.hash);

    // Insert a new entry into the bookmark with the current timestamp
    public func insert(url : Text) : async () {
        let timestamp = Time.now(); // Get current timestamp
        let formattedTime = Int.toText(timestamp / 1_000_000_000); // Convert timestamp to seconds
        let entryWithTime = {
            url = url;
            time = formattedTime;
            clickCount = 0;
            lastClicked = null;
        };
        bookmark.put(url, entryWithTime);
    };

    // Delete an entry by URL
    public func deleteEntry(url : Text) : async () {
        ignore bookmark.remove(url);
    };

    // Increment the click count for a specific URL and update the last clicked timestamp in seconds
    public func incrementClickCount(url : Text) : async () {
        switch (bookmark.get(url)) {
            case (?entry) {
                let updatedEntry = {
                    url = entry.url;
                    time = entry.time;
                    clickCount = entry.clickCount + 1;
                    lastClicked = ?Int.toText(Time.now() / 1_000_000_000) // Update lastClicked in seconds
                };
                bookmark.put(url, updatedEntry);
            };
            case null {};
        };
    };

    // Retrieve all entries in the bookmark
    public query func getAllEntries() : async [(Name, Entry)] {
        return Iter.toArray(bookmark.entries());
    };

    // Pre-upgrade hook to serialize the bookmark entries
    system func preupgrade() {
        stableBookmarkEntries := Iter.toArray(bookmark.entries());
    };

    // Post-upgrade hook to deserialize the bookmark entries
    system func postupgrade() {
        bookmark := Map.fromIter(stableBookmarkEntries.vals(), 0, Text.equal, Text.hash);
    };
};
