/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    // Create a public_profiles collection so reviewer nicknames are visible
    // without exposing any sensitive users fields (email, whiskey_admin, etc.).
    const users = app.findCollectionByNameOrId("users");

    const profiles = new Collection({
        "name": "public_profiles",
        "type": "base",
        "fields": [
            {
                "name":        "user",
                "type":        "relation",
                "required":    true,
                "presentable": true,
                "collectionId": users.id,
                "maxSelect":   1,
                "cascadeDelete": true
            },
            {
                "name":        "nickname",
                "type":        "text",
                "required":    true,
                "presentable": true,
                "min":         1,
                "max":         40
            }
        ],
        // Anyone can list/view profiles (only nickname is stored here)
        "listRule":   "",
        "viewRule":   "",
        // Only authenticated users can create their own profile
        "createRule": "@request.auth.id != ''",
        // Only the profile owner can update or delete
        "updateRule": "user = @request.auth.id",
        "deleteRule": "user = @request.auth.id"
    });
    app.save(profiles);
}, (app) => {
    try { app.delete(app.findCollectionByNameOrId("public_profiles")); } catch (_) {}
});
