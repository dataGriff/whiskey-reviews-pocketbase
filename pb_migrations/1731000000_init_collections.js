/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    // ── 1. Add fields to the built-in users auth collection ──────────────────
    const users = app.findCollectionByNameOrId("users")

    // username field (public display name, required)
    users.fields.addMarshaledJSON(JSON.stringify({
        "id":          "users_username",
        "name":        "username",
        "type":        "text",
        "required":    true,
        "presentable": true,
        "hidden":      false,
        "system":      false,
        "min":         3,
        "max":         30,
        "pattern":     ""
    }))

    // whiskey_admin flag (grants permission to add/edit whiskeys)
    users.fields.addMarshaledJSON(JSON.stringify({
        "id":          "users_whiskey_admin",
        "name":        "whiskey_admin",
        "type":        "bool",
        "required":    false,
        "presentable": false,
        "hidden":      false,
        "system":      false
    }))

    app.save(users)

    // ── 2. Create the whiskeys collection ─────────────────────────────────────
    const whiskeys = new Collection({
        "name": "whiskeys",
        "type": "base",
        "fields": [
            {
                "name": "name", "type": "text",
                "required": true, "presentable": true
            },
            { "name": "distillery",  "type": "text",   "required": false },
            { "name": "country",     "type": "text",   "required": false },
            { "name": "region",      "type": "text",   "required": false },
            {
                "name": "age", "type": "number", "required": false,
                "noDecimal": true
            },
            { "name": "abv",         "type": "number", "required": false },
            {
                "name": "type", "type": "select", "required": false,
                "maxSelect": 1,
                "values": [
                    "Single Malt Scotch", "Blended Scotch",
                    "Bourbon", "Rye", "Irish", "Japanese", "Canadian", "Other"
                ]
            },
            { "name": "description", "type": "text",   "required": false },
            {
                "name": "image", "type": "file", "required": false,
                "maxSelect": 1, "maxSize": 5242880,
                "mimeTypes": ["image/jpeg","image/png","image/webp","image/gif"]
            },
            { "name": "created", "type": "autodate", "onCreate": true,  "onUpdate": false, "presentable": false },
            { "name": "updated", "type": "autodate", "onCreate": true,  "onUpdate": true,  "presentable": false }
        ],
        "listRule":   "",
        "viewRule":   "",
        "createRule": "@request.auth.whiskey_admin = true",
        "updateRule": "@request.auth.whiskey_admin = true",
        "deleteRule": "@request.auth.whiskey_admin = true"
    })
    app.save(whiskeys)

    // ── 3. Create the reviews collection ──────────────────────────────────────
    const reviews = new Collection({
        "name": "reviews",
        "type": "base",
        "fields": [
            {
                "name": "whiskey", "type": "relation",
                "required": true, "collectionId": whiskeys.id,
                "maxSelect": 1, "cascadeDelete": true
            },
            {
                "name": "user", "type": "relation",
                "required": true, "collectionId": users.id,
                "maxSelect": 1, "cascadeDelete": false
            },
            {
                "name": "rating", "type": "number",
                "required": true, "min": 1, "max": 5, "noDecimal": true
            },
            { "name": "title", "type": "text", "required": false, "presentable": true },
            { "name": "body",  "type": "text", "required": false },
            { "name": "created", "type": "autodate", "onCreate": true,  "onUpdate": false, "presentable": false },
            { "name": "updated", "type": "autodate", "onCreate": true,  "onUpdate": true,  "presentable": false }
        ],
        "listRule":   "",
        "viewRule":   "",
        "createRule": "@request.auth.id != ''",
        "updateRule": "@request.auth.id = user.id",
        "deleteRule": "@request.auth.id = user.id"
    })
    app.save(reviews)

}, (app) => {
    // ── Rollback ──────────────────────────────────────────────────────────────
    try { app.delete(app.findCollectionByNameOrId("reviews"))  } catch (_) {}
    try { app.delete(app.findCollectionByNameOrId("whiskeys")) } catch (_) {}
})
