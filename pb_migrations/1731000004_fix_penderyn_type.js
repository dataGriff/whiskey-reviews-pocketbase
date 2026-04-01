/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const col = app.findCollectionByNameOrId("whiskeys")
    const typeField = col.fields.getByName("type")

    // Replace "Welsh Single Malt" with "Single Malt" in the allowed values
    const idx = typeField.values.indexOf("Welsh Single Malt")
    if (idx !== -1) {
        typeField.values[idx] = "Single Malt"
    } else if (!typeField.values.includes("Single Malt")) {
        typeField.values.push("Single Malt")
    }
    app.save(col)

    // Update all Penderyn records that use the old type value
    const records = app.findRecordsByFilter(
        "whiskeys",
        "distillery = 'Penderyn'",
        "-created", 100, 0
    )
    for (const r of records) {
        if (r.get("type") === "Welsh Single Malt") {
            r.set("type", "Single Malt")
            app.save(r)
        }
    }

}, (app) => {
    try {
        const col = app.findCollectionByNameOrId("whiskeys")
        const typeField = col.fields.getByName("type")
        const idx = typeField.values.indexOf("Single Malt")
        if (idx !== -1) {
            typeField.values[idx] = "Welsh Single Malt"
            app.save(col)
        }
        const records = app.findRecordsByFilter(
            "whiskeys",
            "distillery = 'Penderyn'",
            "-created", 100, 0
        )
        for (const r of records) {
            if (r.get("type") === "Single Malt") {
                r.set("type", "Welsh Single Malt")
                app.save(r)
            }
        }
    } catch (_) {}
})
