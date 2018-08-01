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

function createRgbImage(classificationImage) {
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
  return classificationImage.visualize({min:1, max:26, palette: atlasPalette, bands:'remapped'})
}

/*
  getLabelLocations
    Create a collection of ~~center~~points at a given projection. Used for creating
  the collection from which we will sample our basemap.

  Parameters:
    - zoneGeometry (ee.Geometry): The geometry within which we will create our collection of points.
    - [projectionImage] (ee.Image, default: Atlas 2013): The image whose projection
    we will use for the collection of points.
  Returns:
    ee.FeatureCollection (GeometryCollection)

*/
function getLabelLocations(zoneGeometry, projectionImage) {
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
    .map(function(feature) {
      var centroid = feature.centroid(5)
      return centroid
    })
}
exports.getLabelLocations = getLabelLocations
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

function getTrainingInputs(basemap, labels, samplingGeometry, samplingScale) {
  // Use the or operator (which is ||) to set a default value for sampling scale
  samplingScale = samplingScale || 30;
  basemap = ee.Image(basemap)
  labels = ee.Image(labels)
  samplingGeometry = ee.FeatureCollection(samplingGeometry)

  return basemap.addBands(labels)
    .addBands(ee.Image.pixelLonLat())
    // .unmask(-99)
    .sampleRegions({
      collection: samplingGeometry,
      scale: samplingScale
    })
    .map(toPoint)
}
exports.getTrainingInputs = getTrainingInputs

/*
  Train algorithm. Returns a trained collection.
*/
function trainAlgorithm(inputData, trainingBands, classBand) {
  var trainingSize = 0.7
  inputData = inputData.randomColumn('random', 0)
  var trainingData = inputData.filter(ee.Filter.lt('random', trainingSize))
  var testingData = inputData.filter(ee.Filter.gte('random', trainingSize))

  var algorithm = ee.Classifier.randomForest(20)
    .train(trainingData, classBand, trainingBands)
  var testingAccuracy = testingData.classify(algorithm).errorMatrix(classBand, 'classification').accuracy()

  var output = ee.Feature(null, {
    accuracy: testingAccuracy,
    algorithm: algorithm,
  })
  return output
}
exports.trainAlgorithm = trainAlgorithm

/*
  getZonesBoundaries:
    Creates a collection of zoneSize * zoneSize geometries in a given projection,
   which will use as the areas in which we performa a classification. Returns as
   many geometries as cover a given zone.

  Parameters:
    - boundaryGeometry (ee.Geometry): The geometry to which we will limit ourselves.
    - [zoneSize] (Number, default: 56000): Size, in meters, of each side of the classification zone.
    - [projectionImage] (ee.Image, default: Atlas 2013)]: The image whose projection
    will be used for the classification zones.
  Returns:
    ee.FeatureCollection (GeometryCollection)
*/
function getZonesBoundaries(boundaryGeometry, projectionImage) {
  //getZonesBoundaries
  var zoneSize = 56000
  projectionImage = projectionImage || ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
  print(projectionImage)
  boundaryGeometry = ee.FeatureCollection(boundaryGeometry).geometry().buffer(ee.Number(zoneSize).divide(2))
  var projection = ee.Image(projectionImage).projection()
  return ee.Image.random()
    .multiply(10000000)
    .toInt()
    .reduceToVectors({
      crs: projection,
      scale: zoneSize,
      geometry: boundaryGeometry,
      geometryInNativeProjection: true
    })
}
exports.getZonesBoundaries = getZonesBoundaries

/*
  getTimeFilter
    Gets an `or` filter from startDate to endDate, for each of the year in the years
  relative to the start and end dates.
  Parameters:
    - startDate (ee.String|String)
    - endDate (ee.String|String)
    - years (List, default: [-1, 0, 1]): List of years, relative to the start and end dates,
  to create filters for.
*/
function getTimeFilter(startDate, endDate, years) {
  // ditto
  years = ee.List(years || [-1, 0, 1])
  startDate = ee.Date(startDate)
  endDate = ee.Date(endDate)
  var dateFilters = years.map(function(year) {
    return ee.Filter.date(startDate.advance(year, 'year'), endDate.advance(year, 'year'))
  })
  return dateFilters.slice(1)
  .iterate(function(filter, accum) {
    return ee.Filter.or(accum, filter)
  }, dateFilters.get(0))
}
exports.getTimeFilter = getTimeFilter

/*
  maskLandsat
    Masks a single Landsat image, and returns only bands starting with 'B' (ie,
  Landsat's spectral bands). Works on both Landsat 7 and Landsat 8.
*/
function maskLandsat(image) {
  // Bits 0, 3, 4 and 5 are fill, cloud shadow, snow, and cloud.
  var fillBit = ee.Number(2).pow(0).int()
  var cloudShadowBit = ee.Number(2).pow(3).int()
  var snowBit = ee.Number(2).pow(4).int()
  var cloudBit = ee.Number(2).pow(5).int()

  // Get the pixel QA band.
  var qa = image.select('pixel_qa')

  var radsatMask = image
    .select('radsat_qa')
    .eq(0)

  var mask = radsatMask
    .and(qa.bitwiseAnd(cloudShadowBit).eq(0))
    .and(qa.bitwiseAnd(fillBit).eq(0))
    .and(qa.bitwiseAnd(snowBit).eq(0))
    .and(qa.bitwiseAnd(cloudBit).eq(0))
    // .and(image.select('sr_atmos_opacity').lte(300))

  return image
    .updateMask(mask)
    .select(['B.+'])
}
exports.maskLandsat = maskLandsat

/*
  getLandsatImage
    Creates a composited Landsat 7 or 8 image. Composites with median.
*/
function getLandsatImage(geometry, year, landsatCollection) {
  var startDate = ee.Date.fromYMD(year, 9, 15)
  var endDate = ee.Date.fromYMD(year, 11, 15)
  var dateFilter = getTimeFilter(startDate, endDate)
  return landsatCollection.filterBounds(geometry)
    .filter(dateFilter)
    .map(maskLandsat)
    .median()
    .clip(geometry)
}
exports.getLandsatImage = getLandsatImage

function displayLandsat7SR(image, title) {
  title = title || "Landsat 7 SR Image"
  Map.addLayer(image, {min:0, max: 3000, bands: "B3,B2,B1"}, title)
}
exports.displayLandsat7SR = displayLandsat7SR

/*
  Use this function to map over zones.
*/
function classifyZone(classificationZone, classification) {
  classificationZone = ee.FeatureCollection(classificationZone).geometry()
  // Label image: change label image here
  var atlas_2000 = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
  var atlas_2013 = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
  var labelImage = atlas_2013

  // Training and classification years
  var trainingYear = 2013
  // !!!: classificationYear now comes as a parameter
  // var classificationYear = 2016

  // Training bands: the names of the bands that we will classify on
  var ls7Bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B7']
  var ls8Bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B10', 'B11']
  var demBands = ['aspect', 'elevation', 'hillshade', 'slope']
  var trainingBands = ls8Bands
  var classBand = 'b1'

  var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
  var landsat8Collection = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
  var trainingImageCollection = landsat8Collection;

  // Set training and classification images
  var trainingImage = getLandsatImage(classificationZone, trainingYear, trainingImageCollection);
  var classificationImage = getLandsatImage(classificationZone, classificationYear, trainingImageCollection);

  // Create points that we will sample training image at. If using non-Atlas
  // data, change this to randomPoints
  var labelLocations = getLabelLocations(classificationZone, labelImage)
  var inputData = getTrainingInputs(trainingImage, labelImage, labelLocations)
    .filter(ee.Filter.notNull(trainingBands))

  // Uses a random forest by default. Change trainAlgorithm function if you
  // would like to adjust that.
  var trainingResult = trainAlgorithm(inputData, trainingBands, classBand)
  var algorithm = trainingResult.get('algorithm')
  var accuracy = ee.Image(trainingResult.get('accuracy'))

  var classifiedImage = trainingImage.classify(algorithm)
    .set('accuracy', accuracy)
    .toInt()
  var fillImage = ee.Image(0).rename('classification')
    .clip(classificationZone)
    .toInt()

  return ee.Algorithms.If(
    inputData.size().gt(50),
    classifiedImage,
    fillImage
  )
}
exports.classifyZone = classifyZone

function classifyCountry(currentZone, accum) {
  var classifiedZone = ee.Image(classifyZone(currentZone))
  var output = ee.ImageCollection(accum).merge(ee.ImageCollection(classifiedZone))
  return output
}



// Load Country of Interest
var ecowas = ee.FeatureCollection('users/svangordon/ecowas')
print(ecowas.aggregate_histogram('NAME'))
var geometry = ecowas.filter(ee.Filter.eq('NAME', 'Niger'))
  .geometry()
  .convexHull()
// geometry = geometry2
print('geometry', geometry)
Map.addLayer(geometry)

// var atlas_2000 = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
// var atlasGeometry = atlas_2000.geometry()
var zones = getZonesBoundaries(geometry)
  // .filterBounds(atlasGeometry)

Map.addLayer(zones)

var years = ee.List.sequence(2013, 2016)
function classifyYears(classificationYear) {
  var classifiedZones = zones.iterate(classifyCountry, ee.ImageCollection([]))
  var classifiedImage = ee.ImageCollection(classifiedZones).min().selfMask()
  var accuracy = ee.ImageCollection(classifiedZones).aggregate_mean('accuracy')
  var yearString = ee.Algorithms.String(classificationYear)
  Export.image.toAsset({
    image: classifiedImage,
    scale: 30,
    region: zones.geometry().dissolve(5),
    maxPixels: 1e13,
    description: ee.String('classificationExportAsset').cat(yearString).getInfo(),
    pyramidingPolicy: {
      '.default': 'mode'
    }
  })
}

var classifiedZones = zones.iterate(classifyCountry, ee.ImageCollection([]))
var classifiedImage = ee.ImageCollection(classifiedZones).min().selfMask()
var accuracy = ee.ImageCollection(classifiedZones).aggregate_mean('accuracy')

Export.image.toAsset({
  image: classifiedImage,
  scale: 30,
  region: zones.geometry().dissolve(5),
  maxPixels: 1e13,
  description: 'classificationExportAsset',
  pyramidingPolicy: {
    '.default': 'mode'
  }
})

//Export.image.toDrive({
//  image: classifiedImage,
//  scale: 30,
//  region: geometry,
//  maxPixels: 1e13,
//  description: 'classificationExportToDrive',
//  folder: 'eeExports'
//})


// displayClassification(classifiedImage, 'classifiedImage')
