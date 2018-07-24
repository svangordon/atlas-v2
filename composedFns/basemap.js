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

/*
  getClassificationZone:
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
function getZone(boundaryGeometry, projectionImage) {
  //getZoneBoundaries
  var zoneSize = 56000
  projectionImage = projectionImage || ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
  print(projectionImage)
  boundaryGeometry = ee.FeatureCollection(boundaryGeometry).geometry().buffer(ee.Number(zoneSize).divide(2))
  var projection = ee.Image(projectionImage).projection()
  return ee.Image.random()
    .multiply(10000000)
    .toInt()
    .aside(function(im) {Map.addLayer(im)})
    .reduceToVectors({
      crs: projection,
      scale: zoneSize,
      geometry: boundaryGeometry,
      geometryInNativeProjection: true
    })
}

/*
  getPoints
    Create a collection of ~~center~~points at a given projection. Used for creating
  the collection from which we will sample our basemap.

  Parameters:
    - zoneGeometry (ee.Geometry): The geometry within which we will create our collection of points.
    - [projectionImage] (ee.Image, default: Atlas 2013): The image whose projection
    we will use for the collection of points.
  Returns:
    ee.FeatureCollection (GeometryCollection)

*/
function getPoints(zoneGeometry, projectionImage) {
  // getLabelLocations
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

/*
  toPoint
    Takes a feature with `longitude` and `latitude` properties, strips those properties,
  and converts them into a geometry. Used so that features have geometries after a
  `.sampleRegions` call.
*/
function toPoint(feature) {
  // ? under the hood?
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
}

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

/*
  getLandsatImage
    Creates a composited Landsat 7 or 8 image. Composites with median.
*/
function getLandsatImage(geometry, dateFilter, landsatCollection) {
  // getSatelliteImage
  return landsatCollection.filterBounds(geometry)
    .filter(dateFilter)
    .map(maskLandsat)
    .median()
    .clip(geometry)
}

function displayLandsat7SR(image, title) {
  title = title || "Landsat 7 SR Image"
  Map.addLayer(image, {min:0, max: 3000, bands: "B3,B2,B1"}, title)
}

/*
  =====
  Sampling Images
  =====
*/

function sampleCollection(basemap, labels, samplingGeometry, samplingScale) {
  samplingScale = samplingScale || 30;
  basemap = ee.Image(basemap)
  labels = ee.Image(labels)
  samplingGeometry = ee.FeatureCollection(samplingGeometry)

  return basemap.addBands(labels)
    .addBands(ee.Image.pixelLonLat())
    .sampleRegions({
      collection: samplingGeometry,
      scale: samplingScale
    })
    .map(toPoint)
}

/*
  Train algorithm. Returns a trained collection.
*/
function getClassifier(inputData, trainingBands) {
  var trainingSize = 0.7
  var trainingData = inputData.filter(ee.Filter.lt('random', trainingSize))
  var testingData = inputData.filter(ee.Filter.gte('random', trainingSize))
  var classifier = ee.Classifier.randomForest(20)
    .train(trainingData, 'b1', trainingBands)
  var testingAccuracy = testingData.classify(classifier).errorMatrix('b1', 'classification').accuracy()

  return ee.Feature(null, {
    accuracy: testingAccuracy,
    classifier: classifier
  })
}

/*
  Test basemap scripts:
*/

var geometry = geometry || ee.Geometry.Point(-5.999, 7.079)

var zone = getZone(geometry)
Map.addLayer(zone)
Map.addLayer(geometry, {}, 'geometry')
print(zone.geometry())
Map.addLayer(getPoints(zone))

var landsat7 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
var octoberFilter = getTimeFilter('2016-09-15', '2016-11-15')
var landsat7Image = getLandsatImage(zone, octoberFilter, landsat7)
displayLandsat7SR(landsat7Image)

/*
  Test Sampling Scripts
*/
var atlas_2013 = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
// Test samplingPoints
var samplingPoints = getPoints(zone)
var inputData = sampleCollection(landsat7Image, atlas_2013, samplingPoints)
print(inputData)

/*
  Test training a classifier
*/
var ls7Bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B7']
var trainingResult = getClassifier(inputData, ls7Bands)
print('trainingResult', trainingResult)

var classifier = trainingResult.get('classifier')
classifier = ee.Classifier(classifier)

/*
  Classify image
*/
var classifiedImage = landsat7Image.classify(classifier)
displayClassification(classifiedImage)
