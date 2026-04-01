/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const col = app.findCollectionByNameOrId("whiskeys")

    // Add "Single Malt" to the type select field if not already present
    const typeField = col.fields.getByName("type")
    if (!typeField.values.includes("Single Malt")) {
        typeField.values.push("Single Malt")
        app.save(col)
    }

    const penderyn = [
        {
            name:        "Penderyn Madeira",
            distillery:  "Penderyn",
            country:     "Wales",
            region:      "Brecon Beacons",
            age:         0,
            abv:         46.0,
            type:        "Single Malt",
            description: "The flagship expression from Wales' most celebrated distillery, finished in ex-Madeira wine casks. Pale gold in colour with an elegant, light character. Notes of fresh peach, vanilla, coconut, barley sugar and a gentle Madeira sweetness on a smooth, lingering finish. The dram that put Welsh whisky on the world stage."
        },
        {
            name:        "Penderyn Sherrywood",
            distillery:  "Penderyn",
            country:     "Wales",
            region:      "Brecon Beacons",
            age:         0,
            abv:         46.0,
            type:        "Single Malt",
            description: "Matured and finished in Oloroso sherry casks for the richest expression in the Penderyn core range. Deep amber in colour with generous notes of dried fruit, Christmas cake, dark chocolate, cinnamon and a warming sherry sweetness. Fuller-bodied than the Madeira with a long, fruity finish."
        },
        {
            name:        "Penderyn Peated",
            distillery:  "Penderyn",
            country:     "Wales",
            region:      "Brecon Beacons",
            age:         0,
            abv:         46.0,
            type:        "Single Malt",
            description: "A lightly peated expression finished in ex-Madeira casks, combining Penderyn's signature fruit-forward style with a subtle layer of smoke. Notes of smoked vanilla, poached pear, citrus peel and a gentle medicinal smokiness. The peat is restrained, letting the distillery character shine through."
        },
        {
            name:        "Penderyn Rich Oak",
            distillery:  "Penderyn",
            country:     "Wales",
            region:      "Brecon Beacons",
            age:         0,
            abv:         46.0,
            type:        "Single Malt",
            description: "Finished in new American oak casks to give a bolder, more robust character. Notes of toasted coconut, butterscotch, vanilla cream and gentle baking spice with a warm, woody finish. A departure from the classic Penderyn style, this expression appeals to fans of American whiskey."
        },
        {
            name:        "Penderyn Legend",
            distillery:  "Penderyn",
            country:     "Wales",
            region:      "Brecon Beacons",
            age:         0,
            abv:         41.0,
            type:        "Single Malt",
            description: "The entry point to the Penderyn range, bottled at 41% for an approachable everyday dram. Light and delicate with notes of fresh orchard fruit, honey, vanilla and a slight floral quality. An ideal introduction to Welsh single malt whisky without sacrificing the quality Penderyn is renowned for."
        },
        {
            name:        "Penderyn Portwood",
            distillery:  "Penderyn",
            country:     "Wales",
            region:      "Brecon Beacons",
            age:         0,
            abv:         46.0,
            type:        "Single Malt",
            description: "Finished in ex-port casks to give a vibrant, fruit-driven character. Ruby-tinged amber in colour with rich notes of raspberry jam, stewed plum, dark chocolate and a warming port sweetness. The port influence is generous and harmonious, making this one of Penderyn's most indulgent expressions."
        },
        {
            name:        "Penderyn Icons of Wales No.7 Celt",
            distillery:  "Penderyn",
            country:     "Wales",
            region:      "Brecon Beacons",
            age:         0,
            abv:         41.0,
            type:        "Single Malt",
            description: "Part of the Icons of Wales series celebrating Welsh heritage, the Celt expression is lightly peated and named in honour of Wales' ancient Celtic roots. Gentle smoke weaves through notes of citrus zest, green apple and soft vanilla. Approachable and characterful, it honours both the distillery's craft and Welsh culture."
        },
        {
            name:        "Penderyn Single Cask",
            distillery:  "Penderyn",
            country:     "Wales",
            region:      "Brecon Beacons",
            age:         0,
            abv:         58.0,
            type:        "Single Malt",
            description: "Released at natural cask strength without chill-filtration, this bottling showcases the raw character of a single Penderyn cask. Expect intense flavours that vary by release — typically concentrated fruit, oak spice, vanilla and a long, warming finish. A favourite among collectors and connoisseurs of Welsh whisky."
        }
    ]

    for (const data of penderyn) {
        const record = new Record(col, data)
        app.save(record)
    }

}, (app) => {
    try {
        const records = app.findRecordsByFilter(
            "whiskeys",
            "distillery = 'Penderyn'",
            "-created", 100, 0
        )
        for (const r of records) {
            try { app.delete(r) } catch (_) {}
        }
    } catch (_) {}

    try {
        const col = app.findCollectionByNameOrId("whiskeys")
        const typeField = col.fields.getByName("type")
        typeField.values = typeField.values.filter(v => v !== "Single Malt")
        app.save(col)
    } catch (_) {}
})
