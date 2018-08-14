
// Create a function to display Atlas images in EE with the proper colors
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


// First, we want to get the geometry of our country.
// Load the feature collection of ECOWAS boundaries.
var countryBoundaries = ee.FeatureCollection('users/svangordon/ecowas')
print(countryBoundaries.aggregate_histogram('NAME'))
// Get boundaries for a single country
var countryGeometry = countryBoundaries.filter(ee.Filter.equals('NAME', 'Gambie'))
// Add it to the map, just so that we can see it.
Map.addLayer(countryGeometry)

var french_names = ee.Dictionary({
  "1": "Forêt",
  "2": "Savane",
  "3": "Prairie marécageuse - vallée inondable",
  "4": "Steppe",
  "6": "Plantation",
  "7": "Mangrove",
  "8": "Zone de culture",
  "9": "Plans d'eau",
  "10": "Surfaces sableuses",
  "11": "Terrains rocheux",
  "12": "Sols dénudés",
  "13": "Habitations",
  "14": "Cultures irriguées",
  "15": "Forêt galerie et formation ripicole",
  "21": "Forêt dégradée",
  "22": "Bowé",
  "23": "Fourré",
  "24": "Cultures des bas-fonds et de décrue",
  "25": "Forêt claire",
  "27": "Cultures et jachère sous palmier à huile",
  "28": "Forêt marécageuse",
  "29": "Savane sahélienne",
  "31": "Savane herbacée",
  "32": "Zone arbustive",
  "78": "Carrière",
  "99": "Nuage"
})

var classified_images = ee.ImageCollection('users/svangordon/conference/atlas_v2/collections/classify')
  // .limit(2)
// print('classified_images', classified_images)
var asImage = classified_images.toBands()
Map.addLayer(asImage)
print('asImage', asImage)

// Now an image where each pixel is an array, n_years x 1
// var reduced = classified_images.toArray()


var reduction = asImage.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram().forEachBand(asImage),
  geometry: countryGeometry,
  maxPixels: 1e13,
  scale: 30
})
print('reduction unweighted', reduction)

var weightedReduction = asImage.updateMask(0.0009).reduceRegion({
  reducer: ee.Reducer.frequencyHistogram().forEachBand(asImage).splitWeights(),
  geometry: countryGeometry,
  maxPixels: 1e13,
  scale: 30
})
print('weightedReduction', weightedReduction)
//
// var year1 = ee.Array(reduced).get([0])
// var pixel1 = ee.Array(reduced).get([0,0])
// print('reduced', reduced.length())
// print('pixel1', pixel1)
// print('year1 len', year1.length())
//
// print('list', classified_images.toList(100))
// var reduction = classified_images.reduce(
//   ee.Reducer.frequencyHistogram().combine(ee.Reducer.toCollection(['b1']))
// )
// print(reduction)
/*

function make_timeseries(image_collection, geometry, names) {
  var pixel_area = 0.0009
  image_collection = ee.ImageCollection(image_collection)
  // Get the class areas for each image in our collection, using map
  var area_collection = image_collection.map(function(image) {
    var pixelCounts = image
      .rename('classification')
      .reduceRegion({
        reducer: ee.Reducer.frequencyHistogram(),
        geometry: geometry,
        maxPixels: 1e13,
        scale: 30
      })
      .get('classification')
    var classAreas = ee.Dictionary(pixelCounts)
      .map(function(key, value) {
        return ee.Number(value).multiply(pixel_area)
      })
    return ee.Feature(null, classAreas)
  })
  // Set a property on the feature collection, that contains the classes
  // present for the first image.
  // area_collection = ee.FeatureCollection(area_collection)
  //   .set('classes', ee.Feature(ee.FeatureCollection(area_collection).first()).toDictionary().keys())
  // var labels = names.select(area_collection.get('classes')).getInfo()
  var timeseries = ui.Chart.feature.byFeature(area_collection)
    .setChartType('LineChart')
    .setSeriesNames(names)
    .setOptions({
        title: 'Time Series Area',
        vAxis: {
          title: 'km^2',
          // scaleType: 'log'
        },
        hAxis: {
          title: 'year'
        }
      })
  print(timeseries)

  return area_collection
}
var annual_areas = make_timeseries(classified_images, countryGeometry, french_names)
print(annual_areas)




*/
