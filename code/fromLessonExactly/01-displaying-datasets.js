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

var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]
var remappedImage = atlasV2_2000.remap(atlasClasses, ee.List.sequence(1, 26))
/*Map.addLayer(remappedImage, {min:1, max:26, palette: atlasPalette}, 'Atlas Classification')*/

Map.addLayer(remappedImage.addBands(atlasV2_2000), {min:1, max:26, palette: atlasPalette, bands:'remapped'}, 'Atlas Classification, original values available')

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

  var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]

  classificationImage = classificationImage.addBands(remappedImage)

  Map.addLayer(classificationImage, {min: 1, max: 26, palette: atlasPalette, bands:'remapped'}, layerName)

}

displayClassification(atlasV2_2000, 'Atlas 2000')

// Export a classified Image

Export.image.toDrive({
  image: atlasV2_2013,
  folder: 'classifiedLulc',
  fileNamePrefix: 'atlasV2_2013',
  scale: 30,
  description: 'atlasV2_2013',
  maxPixels: 1e13
});

// Export a classified Image

Export.image.toDrive({
  image: atlasV2_2013.visualize(atlasVisParams),
  folder: 'classifiedLulc',
  region: classificationZone,
  fileNamePrefix: 'atlasV2_2013',
  scale: 30,
  description: 'atlasV2_2013',
  maxPixels: 1e13
});
