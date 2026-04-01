/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const col = app.findCollectionByNameOrId("whiskeys")

    const inventory = [
        {
            name:        "Glenfiddich 12 Year Old",
            distillery:  "Glenfiddich",
            country:     "Scotland",
            region:      "Speyside",
            age:         12,
            abv:         40.0,
            type:        "Single Malt Scotch",
            description: "The world's most awarded single malt Scotch whisky. Matured in the finest American oak and European oak casks for at least 12 years, resulting in a fresh and fruity dram. Expect notes of fresh pear, creamy vanilla, subtle oak and a hint of butterscotch."
        },
        {
            name:        "Lagavulin 16 Year Old",
            distillery:  "Lagavulin",
            country:     "Scotland",
            region:      "Islay",
            age:         16,
            abv:         43.0,
            type:        "Single Malt Scotch",
            description: "One of the great Islay malts. Powerful waves of smoke, seaweed and dried fruit balanced by a sweetness of vanilla and malt. A long, warming finish defines this legendary dram."
        },
        {
            name:        "Maker's Mark",
            distillery:  "Maker's Mark",
            country:     "United States",
            region:      "Kentucky",
            age:         0,
            abv:         45.0,
            type:        "Bourbon",
            description: "A handcrafted small-batch bourbon distinguished by its signature red wax seal. Uses red winter wheat instead of rye in the mash bill, giving it a softer, sweeter character with notes of vanilla, caramel and a smooth, long finish."
        },
        {
            name:        "Buffalo Trace",
            distillery:  "Buffalo Trace",
            country:     "United States",
            region:      "Kentucky",
            age:         0,
            abv:         45.0,
            type:        "Bourbon",
            description: "A flagship bourbon from one of America's oldest continually operating distilleries. Rich and complex, with deep flavours of vanilla, toffee, dark fruit and a hint of anise. A smooth, medium-length finish."
        },
        {
            name:        "Jameson Irish Whiskey",
            distillery:  "Midleton",
            country:     "Ireland",
            region:      "County Cork",
            age:         0,
            abv:         40.0,
            type:        "Irish",
            description: "The world's best-selling Irish whiskey. Triple-distilled for exceptional smoothness and blended from pot still and fine grain whiskeys. Notes of sweet, toasted wood, vanilla and light nuttiness with a perfectly balanced finish."
        },
        {
            name:        "Nikka From the Barrel",
            distillery:  "Nikka",
            country:     "Japan",
            region:      "Hokkaido / Miyagi",
            age:         0,
            abv:         51.4,
            type:        "Japanese",
            description: "A blended whisky bottled at cask strength without chill-filtration. Rich and layered with chocolate, dried fruit, vanilla and spice. A warming, long finish. Consistently rated among Japan's finest."
        },
        {
            name:        "Yamazaki 12 Year Old",
            distillery:  "Suntory",
            country:     "Japan",
            region:      "Osaka",
            age:         12,
            abv:         43.0,
            type:        "Japanese",
            description: "Japan's first single malt whisky distillery. Subtle and harmonious with notes of peach, pineapple, grapefruit, clove and vanilla underpinned by Mizunara oak influence. Refined and beautifully balanced."
        },
        {
            name:        "The Balvenie DoubleWood 12 Year Old",
            distillery:  "The Balvenie",
            country:     "Scotland",
            region:      "Speyside",
            age:         12,
            abv:         40.0,
            type:        "Single Malt Scotch",
            description: "Matured first in traditional whisky casks then finished in first-fill Oloroso sherry casks. Notes of honey, vanilla, fresh fruit, cinnamon and sherry sweetness define this classic Speyside dram."
        },
        {
            name:        "Highland Park 12 Year Old",
            distillery:  "Highland Park",
            country:     "Scotland",
            region:      "Orkney",
            age:         12,
            abv:         40.0,
            type:        "Single Malt Scotch",
            description: "From the world's most northerly whisky distillery on the Orkney Islands. Uniquely balanced between heather-honey sweetness and gentle peat smoke, with notes of aromatic peat, vanilla, dried fruits and a mellow, lingering finish."
        },
        {
            name:        "Redbreast 12 Year Old",
            distillery:  "Midleton",
            country:     "Ireland",
            region:      "County Cork",
            age:         12,
            abv:         40.0,
            type:        "Irish",
            description: "Ireland's favourite single pot still whiskey, matured in a combination of Bourbon and Oloroso sherry casks. Richly flavoured with spices, dried fruits, nuts and malt with a long, satisfying finish. Frequently awarded the world's best Irish whiskey."
        }
    ]

    for (const data of inventory) {
        const record = new Record(col, data)
        app.save(record)
    }

}, (app) => {
    // Rollback: best-effort delete of seeded records
    try {
        const col     = app.findCollectionByNameOrId("whiskeys")
        const records = app.findRecordsByFilter("whiskeys", "1=1", "-created", 100, 0)
        for (const r of records) {
            try { app.delete(r) } catch (_) {}
        }
    } catch (_) {}
})
