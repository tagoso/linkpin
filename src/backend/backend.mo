import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Array "mo:base/Array";

actor {
    type Name = Text;

    type Entry = {
        url : Text;
        time : Text;
        clickCount : Nat;
        lastClicked : ?Text;
    };

    type UserBookmarks = Map.HashMap<Name, Entry>;

    // Stable storage for serialization
    private stable var stableUserEntries : [(Principal, [(Name, Entry)])] = [];

    // Runtime state
    private var userBookmarks = Map.HashMap<Principal, UserBookmarks>(0, Principal.equal, Principal.hash);

    private let MAX_ENTRIES : Nat = 200;

    // Helper function to get or create a user's bookmark map
    private func getUserBookmarkMap(user : Principal) : UserBookmarks {
        switch (userBookmarks.get(user)) {
            case (?bookmarkMap) {
                bookmarkMap;
            };
            case null {
                let newMap = Map.HashMap<Name, Entry>(0, Text.equal, Text.hash);
                userBookmarks.put(user, newMap);
                newMap;
            };
        };
    };

    // Insert a new entry into the user's bookmark with the current timestamp
    public shared (msg) func insert(url : Text) : async () {
        let caller = msg.caller;
        let userBookmark = getUserBookmarkMap(caller);

        // Skip addition if current number of entries is 200 or more
        if (userBookmark.size() < MAX_ENTRIES) {
            let timestamp = Time.now();
            let formattedTime = Int.toText(timestamp / 1_000_000_000);
            let entryWithTime = {
                url = url;
                time = formattedTime;
                clickCount = 0;
                lastClicked = null;
            };
            userBookmark.put(url, entryWithTime);
        };
    };

    // Delete an entry by URL for the caller
    public shared (msg) func deleteEntry(url : Text) : async () {
        let caller = msg.caller;
        let userBookmark = getUserBookmarkMap(caller);
        ignore userBookmark.remove(url);
    };

    // Increment the click count for a specific URL for the caller
    public shared (msg) func incrementClickCount(url : Text) : async () {
        let caller = msg.caller;
        let userBookmark = getUserBookmarkMap(caller);

        switch (userBookmark.get(url)) {
            case (?entry) {
                let updatedEntry = {
                    url = entry.url;
                    time = entry.time;
                    clickCount = entry.clickCount + 1;
                    lastClicked = ?Int.toText(Time.now() / 1_000_000_000);
                };
                userBookmark.put(url, updatedEntry);
            };
            case null {};
        };
    };

    // Retrieve all entries for the caller
    public shared (msg) func getEntries() : async [(Name, Entry)] {
        let caller = msg.caller;
        let userBookmark = getUserBookmarkMap(caller);
        return Iter.toArray(userBookmark.entries());
    };

    // Update an existing entry for the caller
    public shared (msg) func updateEntry(url : Text, updatedUrl : Text) : async () {
        let caller = msg.caller;
        let userBookmark = getUserBookmarkMap(caller);

        // Get the existing entry
        switch (userBookmark.get(url)) {
            case (?entry) {
                // Create the updated entry
                let updatedEntry = {
                    url = updatedUrl; // Update the URL
                    time = entry.time; // Keep the original time
                    clickCount = entry.clickCount; // Preserve the click count
                    lastClicked = entry.lastClicked; // Preserve last clicked time
                };

                // Remove the old entry and add the updated one
                ignore userBookmark.remove(url); // Remove the old URL
                userBookmark.put(updatedUrl, updatedEntry); // Add the updated entry
            };
            case null {
                // Do nothing if the entry doesn't exist
            };
        };
    };

    // System upgrade hooks
    system func preupgrade() {
        // Convert HashMap to stable array before upgrade
        stableUserEntries := Array.map<(Principal, UserBookmarks), (Principal, [(Name, Entry)])>(
            Iter.toArray(userBookmarks.entries()),
            func(entry : (Principal, UserBookmarks)) : (Principal, [(Name, Entry)]) {
                (entry.0, Iter.toArray(entry.1.entries()));
            },
        );
    };

    system func postupgrade() {
        // Reconstruct HashMap from stable array after upgrade
        userBookmarks := Map.HashMap<Principal, UserBookmarks>(0, Principal.equal, Principal.hash);

        for ((principal, entries) in stableUserEntries.vals()) {
            let userMap = Map.HashMap<Name, Entry>(0, Text.equal, Text.hash);
            for ((name, entry) in entries.vals()) {
                userMap.put(name, entry);
            };
            userBookmarks.put(principal, userMap);
        };

        // Clear the stable storage after reconstruction
        stableUserEntries := [];
    };
};
