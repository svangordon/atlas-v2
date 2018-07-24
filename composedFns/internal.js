var externalFunctions = require('users/svangordon/atelier:externalFunctions')
var displayClassification = externalFunctions.displayClassification;
var getLabelLocations = externalFunctions.getLabelLocations;
var toPoint = externalFunctions.toPoint;
var getTrainingInputs = externalFunctions.getTrainingInputs;
var trainAlgorithm = externalFunctions.trainAlgorithm;

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
    // .aside(function(im) {Map.addLayer(im)})
    .reduceToVectors({
      crs: projection,
      scale: zoneSize,
      geometry: boundaryGeometry,
      geometryInNativeProjection: true
    })
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

function displayLandsat7SR(image, title) {
  title = title || "Landsat 7 SR Image"
  Map.addLayer(image, {min:0, max: 3000, bands: "B3,B2,B1"}, title)
}

/*
  Use this function to map over zones.
*/
function classifyZone(classificationZone) {
  classificationZone = ee.FeatureCollection(classificationZone).geometry()
  // Label image: change label image here
  var labelImage = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')

  // Training and classification years
  var trainingYear = 2013
  var classificationYear = 2016

  // Training bands: the names of the bands that we will classify on
  var ls7Bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B7']
  var ls8Bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B10', 'B11']
  var demBands = ['aspect', 'elevation', 'hillshade', 'slope']
  var trainingBands = ls7Bands
  var classBand = 'b1'

  var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
  var landsat8Collection = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
  var trainingImageCollection = landsat7Collection;

  // Set training and classification images
  var trainingImage = getLandsatImage(classificationZone, trainingYear, trainingImageCollection);
  var classificationImage = getLandsatImage(classificationZone, classificationYear, trainingImageCollection);

  // Create points that we will sample training image at. If using non-Atlas
  // data, change this to randomPoints
  var labelLocations = getLabelLocations(classificationZone, labelImage)
  var inputData = getTrainingInputs(trainingImage, labelImage, labelLocations)

  // Uses a random forest by default. Change trainAlgorithm function if you
  // would like to adjust that.
  var trainingResult = trainAlgorithm(inputData, trainingBands)
  var algorithm = trainingResult.get('algorithm')
  var accuracy = ee.Image(trainingResult.get('accuracy'))
  algorithm = ee.Classifier(algorithm)
  var classifiedImage = trainingImage.classify(algorithm)
    .set('accuracy', accuracy)

  return classifiedImage
}

exports.classifyZone = classifyZone;
exports.getZonesBoundaries = getZonesBoundaries;
// Draw your own geometry
// var geometry = geometry || ee.Geometry.Point(-4.285, 11.243)






// var country = ee.FeatureCollection('users/svangordon/ecowas')
//   .filter(ee.Filter.eq('NAME', 'Burkina Faso'))
// var zones = getZones(country.geometry())
// Map.addLayer(zones)
// var classifiedZones = zones.map(classifyZone)
// Map.addLayer(classifiedZones, {}, 'classifiedZones')
//
//
// var labelImage = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
// var foo = zones.map(function(zone) {
//   return getTrainingInputs(zone, labelImage)
// })
// Map.addLayer(foo, {}, 'sampling points')
