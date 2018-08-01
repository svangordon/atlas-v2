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

function getPixels(zoneGeometry, projectionImage) {
  zoneGeometry = ee.FeatureCollection(zoneGeometry).geometry()
  projectionImage = projectionImage || ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
  var projection = projectionImage.projection()
  return ee.Image
    .random()
    .multiply(100000)
    .toInt()
    .reduceToVectors({
      crs: projection,
      geometry: zoneGeometry,
      scale: projection.nominalScale(),
      geometryInNativeProjection: true
    })
}

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
    // .map(function(feature) {
    //   var centroid = feature.centroid(5, labelProjection)
    //   return centroid
    // })
}

// /*
//   getLabelLocations
//     Create a collection of ~~center~~points at a given projection. Used for creating
//   the collection from which we will sample our basemap.
//
//   Parameters:
//     - zoneGeometry (ee.Geometry): The geometry within which we will create our collection of points.
//     - [projectionImage] (ee.Image, default: Atlas 2013): The image whose projection
//     we will use for the collection of points.
//   Returns:
//     ee.FeatureCollection (GeometryCollection)
//
// */
// function getLabelLocations(zoneGeometry, projectionImage) {
//   zoneGeometry = ee.FeatureCollection(zoneGeometry).geometry()
//   projectionImage = projectionImage || ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
//   var projection = projectionImage.projection()
//   return ee.Image
//     .random()
//     .multiply(100000)
//     .toInt()
//     .reduceToVectors({
//       crs: projection,
//       geometry: zoneGeometry,
//       scale: projection.nominalScale(),
//       geometryInNativeProjection: true
//     })
//     .map(function(feature) {
//       var centroid = feature.centroid(5)
//       return centroid
//     })
// }
// exports.getLabelLocations = getLabelLocations
/*
  toPoint
    Takes a feature with `longitude` and `latitude` properties, strips those properties,
  and converts them into a geometry. Used so that features have geometries after a
  `.sampleRegions` call.
*/
function toPoint(feature) {
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
}
exports.toPoint = toPoint


// /*
//   getZonesBoundaries:
//     Creates a collection of zoneSize * zoneSize geometries in a given projection,
//    which will use as the areas in which we performa a classification. Returns as
//    many geometries as cover a given zone.
//
//   Parameters:
//     - boundaryGeometry (ee.Geometry): The geometry to which we will limit ourselves.
//     - [zoneSize] (Number, default: 56000): Size, in meters, of each side of the classification zone.
//     - [projectionImage] (ee.Image, default: Atlas 2013)]: The image whose projection
//     will be used for the classification zones.
//   Returns:
//     ee.FeatureCollection (GeometryCollection)
// */
// function getZonesBoundaries(boundaryGeometry, projectionImage) {
//   //getZonesBoundaries
//   var zoneSize = 56000
//   projectionImage = projectionImage || ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
//   print(projectionImage)
//   boundaryGeometry = ee.FeatureCollection(boundaryGeometry).geometry().buffer(ee.Number(zoneSize).divide(2))
//   var projection = ee.Image(projectionImage).projection()
//   return ee.Image.random()
//     .multiply(10000000)
//     .toInt()
//     .reduceToVectors({
//       crs: projection,
//       scale: zoneSize,
//       geometry: boundaryGeometry,
//       geometryInNativeProjection: true
//     })
// }
// exports.getZonesBoundaries = getZonesBoundaries




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
// sample(region, scale, projection, factor, numPixels, seed, dropNulls, tileScale)
// var pixels = getPixels(geometry, atlas_2000)
var pixels = getAtlasGeometries(geometry, 'polygon', atlas_2000)
var pixelsWithLabels = pixels.map(function(pixel) {
  var centroid = pixel.centroid(5)
  var sampledAtlasV2 = atlasV2.sampleRegions({
    collection: centroid,
    scale: 30
  }).first()
  sampledAtlasV2 = ee.FeatureCollection(sampledAtlasV2)
  // pixel = pixel.copyProperties(sampledAtlasV2)
  return pixel.set('classification', sampledAtlasV2.get('b1'))
  // return sampledAtlasV2
})
print(pixelsWithLabels.first())

print('pwl ag hist', pixelsWithLabels.aggregate_histogram('classification'))

// var pixelGeometry = pixels.geometry().dissolve(5)
// Map.addLayer(pixelGeometry, {color: 'green'}, 'pixelGeometry')

var pixelImage = pixelsWithLabels.reduceToImage(['classification'], ee.Reducer.first())
  .toInt()
  .clip(geometry)
print('labelProjection', labelProjection)
pixelImage = pixelImage//.changeProj(pixelImage.projection(), labelProjection)
  .reproject(labelProjection, null, 2000)
// var pixelImageReproj = pixelImage
//   .changeProj(pixelImage.projection(), labelProjection)
  // .reproject({
  //   crs: labelProjection,
  //   scale: 2000
  // })
print('pixelImage', pixelImage)
print('pixelImage proj', pixelImage.projection())
// print('pixelImageReproj', pixelImageReproj)
// print('pixelImageReproj proj', pixelImageReproj.projection())
displayClassification(atlasV2.clip(geometry), 'atlasV2_2013')
displayClassification(atlas_2013.clip(geometry), 'atlas_2013')
displayClassification(pixelImage.clip(geometry), 'pixelImage')
// displayClassification(pixelImageReproj.clip(geometry), 'pixelImageReproj')

// Get statistics for the two images

// print('crs', atlas_2000.projection())
// print('crs', atlas_2000.projection().transform())
// print('crs', atlas_2000.projection().get(''))
function getImageHistogram(image, geometry, scale, pixelArea) {
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
  // chartLabels = chartLabels.select(classAreas.propertyNames()).getInfo()
  // chartLabels = chartLabels
  // print(chartLabels)

  var areaChart = ui.Chart.feature.byProperty(classAreas/*, chartLabels*/)
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
}

Map.addLayer(pixels, {color: 'green'}, 'pixels')
var atlasAreas = getImageHistogram(atlas_2013, geometry, 2000, 4)
// I'm not sure why this wouldn't be exactly the same, but
// var reprojV2Areas = getImageHistogram(pixelImageReproj, geometry, 2000, 4)
var pixelV2Areas = getImageHistogram(pixelImage, geometry, 2000, 4)
var v2Areas = pixelsWithLabels.aggregate_histogram('classification')
v2Areas = ee.Dictionary(v2Areas).map(function(key, value) {
  return ee.Number(value).multiply(4)
})
v2Areas = ee.Feature(null, v2Areas)
// print('pixel image projection', pixelImage.projection())

print('atlasAreas', atlasAreas)
print('v2Areas', v2Areas)
print('pixelV2Areas', pixelV2Areas)
print('otherPxlV2', pixelImage.reduceRegion({
      reducer: ee.Reducer.frequencyHistogram(),
      geometry: geometry,
      maxPixels: 1e13,
      // scale: scale,
      // tileScale: 16,
      // crs: image.projection()
    }))

var atlasSum = atlasAreas.toDictionary().values().reduce(ee.Reducer.sum())
var v2Sum = v2Areas.toDictionary().values().reduce(ee.Reducer.sum())

// var atlasSum = atlasAreas.toArray(atlasAreas.propertyNames()).accum(0)
// var v2Sum = v2Areas.toArray(v2Areas.propertyNames()).accum(0)
// var atlasSum = atlasAreas.toArray(atlasAreas.propertyNames()).reduce({
//   reducer: ee.Reducer.sum(),
//   axes: [0]
// })
// var v2Sum = v2Areas.toArray(v2Areas.propertyNames()).reduce({
//   reducer: ee.Reducer.sum(),
//   axes: [0]
// })
print('atlasSum', atlasSum)
print('v2Sum', v2Sum)
print('difference', ee.Number(v2Sum).subtract(atlasSum))
// print('atlas sum', atlasAreas.aggregate_sum('b1'))
// print('v2 sum', v2Areas.aggregate_sum('classification'))

displayHistogram(atlasAreas, 'atlasAreas')
displayHistogram(v2Areas, 'v2Areas')
displayHistogram(pixelV2Areas, 'pixelV2Areas')
// displayHistogram(noReprojV2Areas, 'noReprojV2Areas')
