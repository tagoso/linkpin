import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Principal "mo:base/Principal";

actor {
    type Name = Text;

    type Entry = {
        url : Text;
        time : Text;
        clickCount : Nat; // Track the number of clicks
        lastClicked : ?Text; // Optional field to store the last clicked timestamp
    };

    type UserBookmarks = Map.HashMap<Name, Entry>;

    // Initialize the user-specific bookmarks as a HashMap
    var userBookmarks = Map.HashMap<Principal, UserBookmarks>(0, Principal.equal, Principal.hash);

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

        let timestamp = Time.now(); // Get current timestamp
        let formattedTime = Int.toText(timestamp / 1_000_000_000); // Convert timestamp to seconds
        let entryWithTime = {
            url = url;
            time = formattedTime;
            clickCount = 0;
            lastClicked = null;
        };
        userBookmark.put(url, entryWithTime);
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
                    lastClicked = ?Int.toText(Time.now() / 1_000_000_000); // Update lastClicked in seconds
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
};
