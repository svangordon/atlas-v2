var atlas_1975 = ee.Image('users/svangordon/conference/atlas/swa_1975lulc_2km')
var atlas_2000 = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
var atlas_2013 = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')

print(atlas_2000)

var atlasV2_2000 = ee.Image('users/svangordon/conference/atlas_v2/classify/2000')
var atlasV2_2001 = ee.Image('users/svangordon/conference/atlas_v2/classify/2001')
/* And so forth. */
var atlasV2_2015 = ee.Image('users/svangordon/conference/atlas_v2/classify/2015')
var atlasV2_2016 = ee.Image('users/svangordon/conference/atlas_v2/classify/2016')

print(atlasV2_2016)

var atlasCollection = ee.ImageCollection('users/svangordon/conference/atlas/atlasCollection')
var atlasV2Collection = ee.ImageCollection('users/svangordon/conference/atlas_v2/collections/classify')

print(atlasV2Collection)

print( atlasV2Collection.filterDate('2005-01-01', '2010-01-01') )

var atlasPalette = [
  "8400a8", // Forest / Forêt
  "8bad8b", // Savanna / Savane
  "000080", // Wetland - floodplain / Prairie marécageuse - vallée inondable
  "ffcc99", // Steppe / Steppe
  "808000", // Plantation / Plantation
  "33cccc", // Mangrove / Mangrove
  "ffff96", // Agriculture / Zone de culture
  "3366ff", // Water bodies / Plans d'eau
  "ff99cc", // Sandy area / surfaces sableuses
  "969696", // Rocky land / Terrains rocheux
  "a87000", // Bare soil / Sols dénudés
  "ff0000", // Settlements / Habitations
  "ccff66", // Irrigated agriculture / Cultures irriguées
  "a95ce6", // Gallery forest and riparian forest / Forêt galerie et formation ripicole
  "d296e6", // Degraded forest / Forêt dégradée
  "a83800", // Bowe / Bowé
  "f5a27a", // Thicket / Fourré
  "ebc961", // Agriculture in shallows and recession / Cultures des bas-fonds et de décrue
  "28734b", // Woodland / Forêt claire
  "ebdf73", // Cropland and fallow with oil palms / Cultures et jachère sous palmier à huile
  "beffa6", // Swamp forest / Forêt marécageuse
  "a6c28c", // Sahelian short grass savanna / Savane sahélienne
  "0a9696", // Herbaceous savanna / Savane herbacée
  "749373", // Shrubland / Zone arbustive
  "505050", // Open mine / Carrière
  "FFFFFF"  // Cloud / Nuage
]

function displayClassification(classificationImage, layerName) {
  // Cast classificationImage to Image
  classificationImage = ee.Image(classificationImage)

  var atlasPalette = [
    "8400a8", // Forest / Forêt
    "8bad8b", // Savanna / Savane
    "000080", // Wetland - floodplain / Prairie marécageuse - vallée inondable
    "ffcc99", // Steppe / Steppe
    "808000", // Plantation / Plantation
    "33cccc", // Mangrove / Mangrove
    "ffff96", // Agriculture / Zone de culture
    "3366ff", // Water bodies / Plans d'eau
    "ff99cc", // Sandy area / surfaces sableuses
    "969696", // Rocky land / Terrains rocheux
    "a87000", // Bare soil / Sols dénudés
    "ff0000", // Settlements / Habitations
    "ccff66", // Irrigated agriculture / Cultures irriguées
    "a95ce6", // Gallery forest and riparian forest / Forêt galerie et formation ripicole
    "d296e6", // Degraded forest / Forêt dégradée
    "a83800", // Bowe / Bowé
    "f5a27a", // Thicket / Fourré
    "ebc961", // Agriculture in shallows and recession / Cultures des bas-fonds et de décrue
    "28734b", // Woodland / Forêt claire
    "ebdf73", // Cropland and fallow with oil palms / Cultures et jachère sous palmier à huile
    "beffa6", // Swamp forest / Forêt marécageuse
    "a6c28c", // Sahelian short grass savanna / Savane sahélienne
    "0a9696", // Herbaceous savanna / Savane herbacée
    "749373", // Shrubland / Zone arbustive
    "505050", // Open mine / Carrière
    "FFFFFF"  // Cloud / Nuage
  ]
  var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]
  var remappedImage = classificationImage.remap(atlasClasses, ee.List.sequence(1, 26))
  classificationImage = classificationImage.addBands(remappedImage)
  Map.addLayer(classificationImage, {min:1, max:26, palette: atlasPalette, bands:'remapped'}, layerName)
}

displayClassification(atlas_2000, 'Atlas 2000')

// // Will not work!
// atlasV2Collection.toList(100).map(function(image) {
//     Map.addLayer(ee.Image(image).getInfo())
//     return image
//   })

atlasV2Collection.getInfo().features.forEach(function(image, index) {
  displayClassification(ee.Image(image.id), "AtlasV2 " + (index + 2000))
})

// function displayClassificationCollection(classificationCollection) {
//   // Create a list of strings that are valid as EE dates (YYYY-MM-DD)
//   var atlasV2Years = [
//     "2000-01-01",
//     "2001-01-01",
//     "2002-01-01",
//     "2003-01-01",
//     "2004-01-01",
//     "2005-01-01",
//     "2006-01-01",
//     "2007-01-01",
//     "2008-01-01",
//     "2009-01-01",
//     "2010-01-01",
//     "2011-01-01",
//     "2012-01-01",
//     "2013-01-01",
//     "2014-01-01",
//     "2015-01-01",
//     "2016-01-01",
//   ]
//
//   atlasV2Years.forEach(function(year) {
//       var classificationImage = classificationCollection
//         .filterDate(year)
//         .first()
//       displayClassification(classificationImage, "Atlas V2 " + year)
//     })
// }
//
// displayClassificationCollection(atlasV2Collection)
