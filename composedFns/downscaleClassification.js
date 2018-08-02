/*
  Functions:
    * displayClassification
    * displayLandsat7SR
    * getLabelLocations (getSamplingPoints)
    * getTrainingInputs (sampleCollection)
    * trainAlgorithm    (trainClassifier)
*/

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
exports.displayClassification = displayClassification

function getAtlasGeometries(zoneGeometry, geometryType, labelProjection) {
  labelProjection = labelProjection.projection()
  zoneGeometry = ee.FeatureCollection(zoneGeometry).geometry()
  return ee.Image
    .random()
    .multiply(100000)
    .toInt()
    .reduceToVectors({
      crs: labelProjection,
      geometry: zoneGeometry,
      // scale: labelProjection.nominalScale(),
      geometryInNativeProjection: true,
      geometryType: geometryType
    })
}


// Load Country of Interest
var ecowas = ee.FeatureCollection('users/svangordon/ecowas')
print(ecowas.aggregate_histogram('NAME'))
var geometry = ecowas.filter(ee.Filter.eq('NAME', 'Burkina Faso'))
  .geometry()
  .convexHull()
// geometry = geometry2
print('geometry', geometry)
Map.addLayer(geometry)

var atlas_2000 = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
var atlas_2013 = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')//.clip(geometry)
var labelProjection = atlas_2013.projection()
// var atlasGeometry = atlas_2000.geometry()
// var zones = getZonesBoundaries(geometry)


var atlasV2 = ee.Image('users/svangordon/conference/atlas_v2/classify/2013')//.clip(geometry)

var pixels = getAtlasGeometries(geometry, 'polygon', atlas_2000)
var pixelsWithLabels = pixels.map(function(pixel) {
  var centroid = pixel.centroid(5)
  var sampledAtlasV2 = atlasV2.sampleRegions({
    collection: centroid,
    scale: 30
  }).first()
  sampledAtlasV2 = ee.FeatureCollection(sampledAtlasV2)
  return pixel.set('classification', sampledAtlasV2.get('b1'))
})

var pixelImage = pixelsWithLabels.reduceToImage(['classification'], ee.Reducer.first())
  .toInt()
  .clip(geometry)
  .reproject(labelProjection, null, 2000)

displayClassification(atlasV2.clip(geometry), 'atlasV2_2013')
displayClassification(atlas_2013.clip(geometry), 'atlas_2013')
displayClassification(pixelImage.clip(geometry), 'atlasV2 2km 2013')

// Get statistics for the two images

function getImageHistogram(image, geometry, pixelArea) {
  var pixelCounts = image
    .rename('classification')
    .reduceRegion({
      reducer: ee.Reducer.frequencyHistogram(),
      geometry: geometry,
      maxPixels: 1e13,
      // scale: scale,
      tileScale: 16,
      // crs: image.projection()
    })
    .get('classification')
  var classAreas = ee.Dictionary(pixelCounts)
    .map(function(key, value) {
      return ee.Number(value).multiply(pixelArea)
    })
  return ee.Feature(null, classAreas)
}

function displayHistogram(classAreas, title) {
  // var chartInput = ee.Feature(null, classAreas)
  // print('chartInput', classAreas)
  var atlasClassMetadata = require('users/svangordon/lulc-conference:atlasClassMetadata')
  var chartLabels = atlasClassMetadata.nameDictionaryFrench
  chartLabels = chartLabels.select(classAreas.propertyNames()).evaluate(function(chartLabels) {
    var areaChart = ui.Chart.feature.byProperty(classAreas, chartLabels)
      .setOptions({
          vAxis: {
            title: 'km^2',
            // scaleType: 'log',
            minValue: 0
          },
          hAxis: {
            title: 'Class'
          }
        })
    print(title, areaChart)
  })
}

Map.addLayer(pixels, {color: 'green'}, 'pixels')
var atlasAreas = getImageHistogram(atlas_2013, geometry, 4)
var v2Areas2km = getImageHistogram(pixelImage, geometry, 4)
var v2Areas30m = getImageHistogram(atlasV2, geometry, 0.0009)

// print('pixel image projection', pixelImage.projection())

print('atlasAreas', atlasAreas)
print('v2Areas2km', v2Areas2km)

var atlasSum = atlasAreas.toDictionary().values().reduce(ee.Reducer.sum())
var sum2km = v2Areas2km.toDictionary().values().reduce(ee.Reducer.sum())
var sum30m = v2Areas30m.toDictionary().values().reduce(ee.Reducer.sum())

print('atlasSum', atlasSum)
print('sum2km', sum2km)
print('sum30m', sum30m)
print('2km - atlas difference', ee.Number(sum2km).subtract(atlasSum))
print('30m - atlas difference', ee.Number(sum30m).subtract(atlasSum))

displayHistogram(atlasAreas, 'atlasAreas')
displayHistogram(v2Areas2km, 'v2Areas2km')
displayHistogram(v2Areas30m, 'v2Areas30m')
